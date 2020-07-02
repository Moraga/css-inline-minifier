# Minificador de CSS

* Comprime o nome das classes para a, b, c, etc
* Remove seletores não utilizados
* Remove blocos de CSS não utilizados
* Mantém e não modifica classes que estiverem na white list

Processamento pode ser único, um arquivo contendo html e css inline ou separado por arquivos.

Tanto processamento único como em lote primeiro o html deve ser processado e depois o css.

## Exemplos

### Processamento único

```js
const CssInlineMinifier = require('css-inline-minifier');

// processamento único
const minifier = new CssInlineMinifier();
const minified = minifier.minify(documentString);

// html e css reduzidos e dados de tamanho
minified.minified;
minified.originalSize;
minified.minifiedSize;

// ou somente
const result = new CssInlineMinifier().minify(documentString).toString();
```

### Múltiplos arquivos

```js
const minifier = new CssInlineMinifier();

// conteúdo do arquivo html 1 e seu output
const htmlOutput1 = minifier.captureAndMinifiesClasses('<div class="first"></div>');

// conteúdo do arquivo html 2 e seu output
const htmlOutput2 = minifier.captureAndMinifiesClasses('<a class="second"></a>');

// conteúdo do arquivo css e seu output
const cssOutput = minifier.processStyleTags('<style>.some {color: white} .original {color: red}</style>');
```

## Melhorias

Apenas seletores com classes são removidos, seletores com tags e outros não são processados por questão (inicial) de desempenho.