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
				if (!operand.hasOwnProperty('type')) throw `Unspecified type of condition operation in condition evaluation block`;
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
			default:
				throw `Unexpected token "${operand.tagName}" in condition evaluation block`;
		}
	}
	return result;
}

function eval_concat_block(node) {
	let result = '';
	for (let operand of node.children) {
		if (operand.hasOwnProperty('var')) {
			result += String(env_vars[operand.attributes['var'].value]);
		} else if (operand.hasOwnProperty('ctx')) {
			result += String(this[operand.attributes['this'].value]);
		} else if (operand.hasOwnProperty('lit')) {
			result += operand.attributes['lit'].value;
		} else {
			throw `Not properly defined variable in concatenation evaluation block`
		}
	}
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
				if (!operand.hasOwnProperty('type')) throw `Unspecified type of math operation in math evaluation block`;
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
			let condition_block = node.children[0];
			let condition = eval_condition_block.bind(this)(condition_block);

			if (condition) {
				for (let command of node.children[1].children) {
					execute_command.bind(this)(command);
				}
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