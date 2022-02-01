let env = document.getElementById('code');
let env_vars = {};
let env_funcs = {};
let global_stack = [];
let ret_value;
let stop = false;

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
			let exp_value;
			if (node.attributes.hasOwnProperty('ctx')) {
				
			}
			break;
		default:
			throw `Unknown token ${node.tagName} in execution`;
	}
}

for (let node of env.children) {
	execute_command(node);
}