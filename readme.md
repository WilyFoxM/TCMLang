# TCMLang - Turing Complete Markup Language

### Basically a joke, not a proper programming language, but you can use it for fun as I'm doing!

### Quick start


##### Add interpreter:
```html
    <script src="https://gist.github.com/WilyFoxM/f4d2ebfb87893c97ca0d38795932e1a3.js"></script>
```

##### Create \<code>\</code> block with id="code":
```html
    <code id="code"></code>
```

##### Hello, World! in TCMLang:
```html
    <print data="Hello, World!"></print>
```

### For detailed examples view "examples" directory
### Have fun!



| KeyWord  | attr | attr | attr     | attr     | attr    | attr   | attr   | attr | attr |
|----------|------|------|----------|----------|---------|--------|--------|------|------|
| print    | data | var  | ctx      | -        | -       | -      | -      | -    | -    |
| let      | name | -    | -        | -        | -       | -      | -      | -    | -    |  
| exp      | var  | ctx  | -        | -        | -       | -      | -      | -    | -    |  
| concat   | var  | ctx  | -        | -        | -       | -      | -      | -    | -    |  
| for      | var  | from | from_var | from_ctx | to      | to_var | to_ctx | -    | -    |  
| if       | -    | -    | -        | -        | -       | -      | -      | -    | -    |  
| function | name | ctx  | -        | -        | -       | -      | -      | -    | -    |  
| call     | name | var  | ctx_var  | ret      | ctx_ret | -      | -      | -    | -    |  
| return   | ctx  | -    | -        | -        | -       | -      | -      | -    | -    |  
| while    | var  | bool | -        | -        | -       | -      | -      | -    | -    |  
| switch   | var  | ctx  | -        | -        | -       | -      | -      | -    | -    |  
| sqrt     | var  | ctx  | lit      | to       | to_ctx  | -      | -      | -    | -    |  
| stop     | -    | -    | -        | -        | -       | -      | -      | -    | -    |  
| false    | var  | ctx  | -        | -        | -       | -      | -      | -    | -    |  