let env_vars = {};
let env_funcs = {};
let global_stack = [];
let ret_value;
let stop = false;

function eval_condition_block(node) {
	let result;
	let stack = [];
	let str = false;
	if (node.attributes.hasOwnProperty('type')) srt = true;

	for (let operand of node.children) {
		switch (operand.tagName) {
			case 'VAR':
				if (operand.attributes.hasOwnProperty('lit')) {
					stack.push(operand.attributes['lit'].value);
				} else if (operand.attributes.hasOwnProperty('ctx')) {
					stack.push(this[operand.attributes['ctx'].value]);
				} else if (operand.attributes.hasOwnProperty('name')) {
					stack.push(env_vars[operand.attributes['name'].value]);
				} else {
					throw `Not properly defined variable in math evaluation block`;
				}
				break;
			case 'EQ':
				if (!operand.attributes.hasOwnProperty('type')) throw `Unspecified type of condition operation in condition evaluation block`;
				if (stack.length !== 2) throw `Expected 2 elements on condition evaluation stack, but got ${stack.length}`;

				let a;
				let b;
				if (!str) {
					b = parseInt(stack.pop());
					a = parseInt(stack.pop());
				} else {
					b = String(stack.pop());
					a = String(stack.pop());
				}

				switch (operand.attributes['type'].value) {
					case '=':
						result = a === b;
						break;
					case '!=':
						result = a !== b;
						break;
					case '>':
						result = a > b;
						break;
					case '>=':
						result = a >= b;
						break;
					case '<':
						result = a < b;
						break;
					case '<=':
						result = a <= b;
						break;
				}
				break;
			case 'EXP':
				stack.push(eval_math_block.bind(this)(operand));
				break;
			default:
				throw `Unexpected token "${operand.tagName}" in condition evaluation block`;
		}
	}
	return result;
}

function eval_concat_block(node) {
	let result = '';
	for (let operand of node.children) {
		if (operand.attributes.hasOwnProperty('var')) {
			result += String(env_vars[operand.attributes['var'].value]);
		} else if (operand.attributes.hasOwnProperty('ctx')) {
			result += String(this[operand.attributes['this'].value]);
		} else if (operand.attributes.hasOwnProperty('lit')) {
			result += operand.attributes['lit'].value;
		} else {
			throw `Not properly defined variable in concatenation evaluation block`
		}
	}
	return result;
}

function eval_math_block(node) {
	let result;
	let stack = [];

	for (let operand of node.children) {
		switch (operand.tagName) {
			case 'VAR':
				if (operand.attributes.hasOwnProperty('lit')) {
					stack.push(operand.attributes['lit'].value);
				} else if (operand.attributes.hasOwnProperty('ctx')) {
					stack.push(this[operand.attributes['ctx'].value]);
				} else if (operand.attributes.hasOwnProperty('name')) {
					stack.push(env_vars[operand.attributes['name'].value]);
				} else {
					throw `Not properly defined variable in math evaluation block`;
				}
				break;
			case 'EXP':
				stack.push(eval_math_block(operand));
				break;
			case 'OPERAND':
				if (!operand.attributes.hasOwnProperty('type')) throw `Unspecified type of math operation in math evaluation block`;
				if (stack.length !== 2) throw `Expected 2 elements on math evaluation stack, but got ${stack.length}`;

				let b = parseInt(stack.pop());
				let a = parseInt((stack.pop()));

				if (isNaN(a)) throw `Unexpected value "${a} on math evaluation stack"`;
				if (isNaN(b)) throw `Unexpected value "${b} on math evaluation stack"`;

				switch (operand.attributes['type'].value) {
					case '+':
						result = a + b;
						break;
					case '-':
						result = a - b;
						break;
					case '/':
						result = a / b;
						break;
					case '*':
						result = a * b;
						break;
					case '%':
						result = a % b;
						break;
					case '**':
						result = a ** b;
						break;
					default:
						throw `Unexpected type of operation "${operand.attributes['type'].value}" in math evaluation block`;
				}
				break;
			default:
				throw `Unexpected token "${operand.tagName}" in math evaluation block`;
		}
	}
	return result;
}

function execute_command(node) {
	switch (node.tagName) {
		case 'PRINT':
			let print_value = '';
			if (node.attributes.hasOwnProperty('data')) {
				print_value = node.attributes['data'].value;
			} else if (node.attributes.hasOwnProperty('var')) {
				if (node.attributes.hasOwnProperty('lit_idx')) {
					print_value = env_vars[node.attributes['var'].value][node.attributes['lit_idx'].value];
				} else if (node.attributes.hasOwnProperty('var_idx')) {
					print_value = env_vars[node.attributes['var'].value][env_vars[node.attributes['lit_idx'].value]];
				} else if (node.attributes.hasOwnProperty('ctx_idx')) {
					print_value = env_vars[node.attributes['var'].value][this[node.attributes['lit_idx'].value]];
				} else {
					print_value = env_vars[node.attributes['var'].value];
				}
			} else if (node.attributes.hasOwnProperty('ctx')) {
				print_value = this[node.attributes['ctx'].value];
			} else {
				throw `Not properly specified PRINT token`;
			}
			console.log(print_value);
			break;
		case 'LET':
			let let_value = node.innerText.trim();
			if (node.attributes.hasOwnProperty('ctx_var')) {
				let_value = this[node.attributes['ctx_var'].value];
			} else if (node.attributes.hasOwnProperty('var')) {
				let_value = env_vars[node.attributes['var'].value];
			} else if (node.attributes.hasOwnProperty('lit')) {
				let_value = node.attributes['lit'].value;
			}
			if (node.attributes.hasOwnProperty('ctx_name')) {
				this[node.attributes['ctx_name'].value] = let_value;
			} else if (node.attributes.hasOwnProperty('name')) {
				env_vars[node.attributes['name'].value] = let_value;
			}
			break;
		case 'EXP':
			let exp_value = eval_math_block.bind(this)(node);
			if (node.attributes.hasOwnProperty('ctx')) {
				this[node.attributes['ctx'].value] = exp_value;
			} else if (node.attributes.hasOwnProperty('var')) {
				env_vars[node.attributes['var'].value] = exp_value;
			}
			break;
		case 'CONCAT':
			let concat_value = eval_concat_block.bind(this)(node);
			if (node.attributes.hasOwnProperty('var')) {
				env_vars[node.attributes['var'].value] = concat_value;
			} else if (node.attributes.hasOwnProperty('ctx')) {
				this[node.attributes['ctx'].value] = concat_value;
			} else {
				throw `Not specified output of concatenation block`;
			}
			break;
		case 'FOR':
			stop = false;
			let from;
			let to;
			if (!node.attributes.hasOwnProperty('var')) throw `Unspecified "var" value in FOR loop block`;
			let var_name = node.attributes['var'].value;

			if (node.attributes.hasOwnProperty('from')) {
				from = node.attributes['from'].value;
			} else if (node.attributes.hasOwnProperty('from_var')) {
				from = env_vars[node.attributes['from_var'].value];
			} else if (node.attributes.hasOwnProperty('from_ctx')) {
				from = this[node.attributes['from_ctx'].value];
			} else {
				throw `Unspecified "from" value in FOR loop block`;
			}
			if (node.attributes.hasOwnProperty('to')) {
				to = node.attributes['to'].value;
			} else if (node.attributes.hasOwnProperty('to_var')) {
				to = env_vars[node.attributes['to_var'].value];
			} else if (node.attributes.hasOwnProperty('to_ctx')) {
				to = this[node.attributes['to_ctx'].value];
			} else {
				throw `Unspecified "to" value in FOR loop block`;
			}

			for (let i = from; i < to; i++) {
				if (stop) return;
				let context = {};
				if (!this.hasOwnProperty('Window')) context = this;
				context[var_name] = i;
				for (let command of node.children) {
					execute_command.bind(context)(command);
				}
			}
			break;
		case 'IF':
			if (node.children.length !== 2) throw `Expected 2 blocks in IF block (COND, DO) but got ${node.children.length}`;
			if (node.children[0].tagName !== 'COND') throw `Expected token "COND" as first in IF block`;
			if (node.children[1].tagName !== 'DO') throw `Expected token "DO" as second in IF block`;
			let condition_block = node.children[0];
			let condition = eval_condition_block.bind(this)(condition_block);

			if (condition) {
				for (let command of node.children[1].children) {
					execute_command.bind(this)(command);
				}
			}
			break;
		case 'FUNCTION':
			if (!node.attributes.hasOwnProperty('name')) throw `Unspecified function name in main execution`;
			env_funcs[node.attributes['name'].value] = {'func': node, 'attr': node.attributes};
			break;
		case 'CALL':
			if (!node.attributes.hasOwnProperty('name')) throw `Unspecified function name in "CALL" block`;
			let call_context = {};
			if (!this.hasOwnProperty('Window')) call_context = this;
			if (node.attributes.hasOwnProperty('var')) {
				let vars = env_funcs[node.attributes['name'].value].attr['ctx'].value.split(' ');
				let exec_vars = node.attributes['var'].value.split(' ');
				if (vars.length !== exec_vars.length) throw `Not properly specified call variables is "CALL" block`;

				for (let i = 0; i < vars.length; i++) {
					call_context[vars[i]] = env_vars[exec_vars[i]];
				}
			} else if (node.attributes.hasOwnProperty('ctx_var')) {
				let vars = env_funcs[node.attributes['name'].value].attr['ctx'].split(' ');
				let exec_vars = node.attributes['var'].value.split(' ');
				if (vars.length !== exec_vars.length) throw `Not properly specified call variables is "CALL" block`;

				for (let i = 0; i < vars.length; i++) {
					call_context[vars[i]] = this[exec_vars[i]];
				}
			}

			for (let command of env_funcs[node.attributes['name'].value].func.children) {
				execute_command.bind(call_context)(command);
			}

			if (node.attributes.hasOwnProperty('ret')) {
				env_vars[node.attributes['ret'].value] = ret_value;
			} else if (node.attributes.hasOwnProperty('ctx_ret')) {
				this[node.attributes['ctx_ret'].value] = ret_value;
			}
			break;
		case 'RETURN':
			if (!node.attributes.hasOwnProperty('ctx')) throw `Expected to return context variable value in "RETURN" block`;
			ret_value = this[node.attributes['ctx'].value];
			break;
		case 'WHILE':
			stop = false;
			let while_context = {};
			if (!this.hasOwnProperty('Window')) while_context = this;
			if (node.attributes.hasOwnProperty('bool')) {
				while_context[node.attributes['bool'].value] = true;
				let while_condition = while_context[node.attributes['bool'].value];
				while (while_condition) {
					while_condition = while_context[node.attributes['bool'].value];
					if (!while_condition) return;
					if (!stop) return;
					for (let command of node.children) {
						execute_command.bind(while_context)(command);
					}
				}
			} else if (node.attributes.hasOwnProperty('var')) {
				if (node.children.length !== 2) throw `Expected 2 blocks in IF block (COND, DO) but got ${node.children.length}`;
				if (node.children[0].tagName !== 'COND') throw `Expected token "COND" as first in IF block`;
				if (node.children[1].tagName !== 'DO') throw `Expected token "DO" as second in IF block`;
				for (let variable of node.attributes['var'].value.split(' ')) {
					while_context[variable] = 0;
				}

				let while_condition_block = node.children[0];
				let while_condition = eval_condition_block.bind(while_context)(while_condition_block);

				while (while_condition) {
					while_condition = eval_condition_block.bind(while_context)(while_condition_block);
					if (!while_condition) return;
					if (stop) return;
					for (let command of node.children[1].children) {
						execute_command.bind(while_context)(command);
					}
				}
			}
			break;
		case 'SWITCH':
			let cmp;
			let sw_context = {};
			if (!this.hasOwnProperty('Window')) sw_context = this;
			if (node.attributes.hasOwnProperty('var')) {
				cmp = env_vars[node.attributes['var'].value];
				sw_context[node.attributes['var'].value] = cmp;
			} else if (node.attributes.hasOwnProperty('ctx')) {
				cmp = this[node.attributes['ctx'].value];
				sw_context[node.attributes['ctx'].value] = cmp;
			} else {
				throw `Not properly specified switch value in "SWITCH" block`;
			}

			for (let cases of node.children) {
				switch (cases.tagName) {
					case 'CASE':
						if (cases.children.length !== 2) throw `Expected 2 blocks in CASE block (COND, DO) but got ${cases.children.length}`;
						if (cases.children[0].tagName !== 'COND') throw `Expected token "COND" as first in CASE block`;
						if (cases.children[1].tagName !== 'DO') throw `Expected token "DO" as second in CASE block`;
						let case_cond_block = cases.children[0];
						let case_cond = eval_condition_block.bind(sw_context)(case_cond_block);
						if (case_cond) {
							for (let command of cases.children[1].children) {
								execute_command.bind(sw_context)(command);
							}
							return;
						}
						break;
					case 'DEFAULT':
						for (let command of cases.children[1].children) {
							execute_command.bind(sw_context)(command);
						}
						return;
					default:
						throw `Unexpected token ${cases.tagName} in "SWITCH" block`;
				}
			}
			break;
		case 'SQRT':
			let sqrt_val;
			if (node.attributes.hasOwnProperty('var')) {
				sqrt_val = Math.sqrt(env_vars[node.attributes['var'].value]);
			} else if (node.attributes.hasOwnProperty('ctx')) {
				sqrt_val = Math.sqrt(this[node.attributes['ctx'].value]);
			} else if (node.attributes.hasOwnProperty('lit')) {
				sqrt_val = Math.sqrt(node.attributes['lit'].value);
			} else {
				throw `Not properly specified input value for "SQRT" block`;
			}
			if (node.attributes.hasOwnProperty('to')) {
				env_vars[node.attributes['to'].value] = sqrt_val;
			} else if (node.attributes.hasOwnProperty('to_ctx')) {
				this[node.attributes['to_ctx'].value] = sqrt_val;
			} else {
				throw `Not properly specified output variable for "SQRT" block`;
			}
			break;
		case 'STOP':
			stop = true;
			break;
		case 'FALSE':
			if (node.attributes.hasOwnProperty('var')) {
				env_vars[node.attributes['var'].value] = false;
			} else if (node.attributes.hasOwnProperty('ctx')) {
				this[node.attributes['ctx'].value] = false;
			} else {
				throw `Not properly specified output variable for "FALSE" block`
			}
			break;
		default:
			throw `Unknown token ${node.tagName} in execution`;
	}
}

let env = document.getElementById('code');
for (let node of env.children) {
	execute_command(node);
}