const CssHtmlMinifier = require('./index');
const assert = require('assert');

describe('Funcionalidades', () => {
    // instancia o minificador
    const minifier = new CssHtmlMinifier();

    // o html é processado primeiro. encontramos tudo que é obrigatório
    // importante: nesse momento as classes já são convertidas
    const a = minifier.captureAndMinifiesClasses('<div class="first"></div>');
    const b = minifier.captureAndMinifiesClasses('<a class="second"></a>');

    // vários chunks ou arquivos html podem ser processados na mesma instancia
    // criando uma grande estrutura de compactação
    const n = minifier.captureAndMinifiesClasses('<a class="third"></a>');

    // existe uma white list para classes reservadas
    // essas classes não são reduzidas
    minifier.whiteList.push('original');

    // depois de processar todos os html é a vez de processar os css
    // sabemos todas os seletores usados e suas formas reduzidas
    // então é a hora de aplicar a redução e remove seletores e blocos não utilizados
    const d = minifier.processStyleTags('<style>.some {color: white} .original {color: red}</style>');

    it('Todos seletores encontrados', () => {
        assert.equal(minifier.getClasses().join(','), 'first,second,third');
    });

    it('Alias do segundo seletor deve ser "b"', () => {
        assert.equal(minifier.getClassAlias('second'), 'b');
    });

    it('White list', () => {
        assert.equal(d.includes('original'), true);
    });
});

describe('Cenários', () => {
    it('Reduzir nome de 1 classe', () => {
        const content = `<style>.large-class {color: red}</style><div class="large-class"></div>`;
        const expected = `<style>.a {color: red}</style><div class="a"></div>`;

        const minifier = new CssHtmlMinifier();
        const minified = minifier.minify(content);

        assert.equal(minified.minified, expected);
    });

    it('Reduzir nome de 2 classes', () => {
        const content = `<style>.nav {color: red} .logo {color: red}</style><div class="nav"></div><div class="logo"></div>`;
        const expected = `<style>.a {color: red} .b {color: red}</style><div class="a"></div><div class="b"></div>`;

        const minifier = new CssHtmlMinifier();
        const minified = minifier.minify(content);

        assert.equal(minified.minified, expected);
    });

    it('Remover seletor não encontrado e seu bloco de definições', () => {
        const content = `<style>.nao-existo {color: red}</style> <div></div>`;
        const expected = `<style></style> <div></div>`;

        const minifier = new CssHtmlMinifier();
        const minified = minifier.minify(content);

        assert.equal(minified.minified, expected);
    });

    it('Remover apenas seletor não encontrado de um bloco com múltiplos seletores', () => {
        const content = `<style>.existo, .nao-existo {color: red}</style><a class="existo"></a>`;
        const expected = `<style>.a{color: red}</style><a class="a"></a>`;

        const minifier = new CssHtmlMinifier();
        const minified = minifier.minify(content);

        assert.equal(minified.minified, expected);
    });

    it('Não reduzir seletores da white list (presente no HTML)', () => {
        const content = `<style>.amp-social-share-item, {color: red}</style><a class="amp-social-share-item"></a>`;
        const expected = content;

        const minifier = new CssHtmlMinifier();
        const minified = minifier.minify(content);

        assert.equal(minified.minified, expected);
    });

    it('Não reduzir seletores da white list (mesmo não presente no HTML)', () => {
        const content = `<style>.amp-social-share-item, {color: red}</style>`;
        const expected = content;

        const minifier = new CssHtmlMinifier();
        const minified = minifier.minify(content);

        assert.equal(minified.minified, expected);
    });
});