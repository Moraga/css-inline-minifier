
/**
 * CSS Inline Minifier
 * 
 * - Class names are reduced to from one character
 * - Unused selectors are removed
 * - Thre is a whitelist
 * - Supports single and multiple files
 * 
 */
class CssInlineMinifier {
    constructor() {
        // mapa com classe na forma original e reduzida
        this.map = {};

        // seletores reservados
        // não são reduzidos ou removidos
        this.whiteList = [
            'amp-',
            'opened',
            'noscroll',
            'submenu',
            'overflow-y',
            'nominify-'
        ];

        // sistema de números para usa na criação de nomes
        this.ns = new NumeralSystem();

        // acumuladores de tamanho para cálculo/porcentagem de redução
        this.originalSize = 0;
        this.minifiedSize = 0;
    }

    /**
     * Verifica se o seletor está na white list
     * @param {string} name 
     * @return bool
     */
    inWhiteList(name) {
        return this.whiteList.some(item => name.includes(item));
    }

    /**
     * Verifica se uma classe está no mapa
     * @param {string} name Nome da classe
     */
    hasClassAlias(name) {
        return this.map.hasOwnProperty(name);
    }

    /**
     * Retorna a forma reduzida de uma classe
     * @param {string} name Nome da classe
     */
    getClassAlias(name) {
        return this.map[name];
    }

    /**
     * Cria forma reduzida para uma classe, desde que ela não seja reservada
     * @param {string} name Nome da classe
     * @return {string} Forma reduzida
     */
    createClassAlias(name) {
        return this.map[name] = this.inWhiteList(name) ? name : this.ns.next();
    }

    /**
     * Retorna forma reduzida de uma classe, se não existir a forma reduzida é criada
     * @param {string} name Nome da classe
     * @return {string} Forma reduzida
     */
    getOrCreateClassAlias(name) {
        return this.hasClassAlias(name) ? this.getClassAlias(name) : this.createClassAlias(name);
    }

    /**
     * Retorna todas as classes mapeadas
     * @return {array} Lista de nomes das classes
     */
    getClasses() {
        return Object.keys(this.map);
    }

    /**
     * Popula a white list de classes a partir de uma string HTML
     * @param {string} content 
     */
    fillWhiteList(content) {
        let whiteList = [];

        // captura seletores especiais
        content.replace(/\[class.=["']?([^\]"']+)/sg, (_, expr) => {
            whiteList.push(expr);
            return _;
        });

        this.whiteList.push(...new Set(whiteList));
    }

    /**
     * Processa HTML e retorna o HTML modificado
     * @param {string} content HTML original
     * @return {string} HTML processado
     */
    captureAndMinifiesClasses(content) {
        return content
            .replace(/\sclass=["']([^"']+)["']/sg, (_, v) => ' class="' + 
                v.trim().split(/\s+/).map(name => this.getOrCreateClassAlias(name)).join(' ') + '"');
    }

    /**
     * Processa e retorna o CSS modificado
     * @param {string} content CSS original
     * @return {string} CSS processado
     */
    processStyleTags(content) {
        return content.replace(/<style([^>]*)>(.*?)<\/style>/sg, (_, attr, style) => {
            const size = style.length;
            
            let sheet = '';
        
            for (let i = 0, char, temp='', selector='', depth=0; i < size; ++i) {
                char = style.charAt(i);
        
                if (char == '{') {
                    if (!depth++) {
                        selector = temp;
                        temp = '';
                        continue;
                    }
                }
                else if (char == '}') {
                    if (!--depth) {
                        const valid = [];
                        
                        for (let s of selector.split(',')) {
                            let ok = true;
                            s = s.replace(/\.([\d\w-]+)/g, (_, name, pos) => {
                                if (this.hasClassAlias(name)) {
                                    return '.' + this.getClassAlias(name);
                                }
                                else if (this.inWhiteList(name)) {
                                    return '.' + name;
                                }
                                else if (pos >= 5 && s.charAt(pos - 1) == '(' && s.slice(pos - 5, pos - 1) == ':not') {
                                    return _;
                                }
                                ok = false;
                                return '';
                            });
        
                            if (ok) {
                                valid.push(s);
                            }
                        }
        
                        if (valid.length) {
                            // definições -moz e -ms não são removidas da assinatura amp
                            // são obrigatórias (16/04/2019) para o validador
                            if (' amp-boilerplate' !== attr) {
                                temp = temp.replace(/-(?:moz|ms)-[\w\s-]+:[^;]+;?/sg, '');
                                temp = temp.replace(/[^;:]+:\s*-(?:moz|ms)-[^;]+;?/sg, '').trim();
                            }

                            if (temp) {
                                sheet += valid.join(',') + '{' + temp + '}';
                            }
                        }

                        temp = '';
                        continue;
                    }
                }
        
                temp += char;
            }

            this.originalSize += size;
            this.minifiedSize += sheet.length;
        
            return '<style' + attr + '>' + sheet + '</style>';
        });
    }

    /**
     * Processa e modifica uma string contendo HTML e CSS
     * @param {string} content HTML e CSS original
     * @return {string} HTML e CSS modificado
     */
    minify(content) {
        this.resetCachedSizes();
        this.fillWhiteList(content);
        let modified = this.captureAndMinifiesClasses(content);
        modified = this.processStyleTags(modified);
        return new CssHInlineMinified(modified, this.originalSize, this.minifiedSize);
    }

    /**
     * Redefine os contadores de tamanho
     */
    resetCachedSizes() {
        this.originalSize = 0;
        this.minifiedSize = 0;
    }
}

/**
 * Cache de minificação de HTML e CSS inline
 */
class CssHInlineMinified {
    /**
     * Cache de redução de HTML e CSS inline
     * @param {string} minified HTML e CSS modificado
     * @param {number} originalSize Tamanho original
     * @param {number} minifiedSize Tamanho reduzido
     */
    constructor(minified, originalSize, minifiedSize) {
        this.minified = minified;
        this.originalSize = originalSize;
        this.minifiedSize = minifiedSize;
    }

    /**
     * Retorna tamanho reduzido em bytes
     * @return {number}
     */
    reducedSize() {
        return this.originalSize - this.minifiedSize;
    }

    /**
     * Retorna a porcentagem de redução
     * @return {number}
     */
    reducedPercentage() {
        return this.reducedSize() / this.originalSize * 100;
    }

    toString() {
        return this.minified;
    }
}

/**
 * Sistema de números
 */
class NumeralSystem {
    /**
     * Cria um sistema de números considerando a base o total de caracteres enviados em opts
     * @param {string} opts Lista de caracteres do sistema de números
     */
    constructor(opts='0abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_') {
        this.opts = opts;
        this.size = opts.length;
        this.i = 0;
    }

    /**
     * Obtém um número no sistema de números correlacionado ao sistema base 10
     * @param {number} n Número no sistema base 10
     * @param {string?} r Corresponde ao 0 no sistema de números gerado
     * @return {string} Valor corresponde ao número no sistema base 10
     */
    get(n, r='') {
        if (!n) return this.opts[0];
        for (; n >= 1; r = this.opts[n % this.size] + r, n = Math.floor(n / this.size));
        return r;
    }

    /**
     * Retorna o número para próxima posição e atualiza o cursor
     * @returns {string}
     */
    next() {
        return this.get(++this.i);
    }

    /**
     * Redefine o sistema de contagem interno usado automaticamente em next
     */
    reset() {
        this.i = 0;
    }
}

module.exports = CssInlineMinifier;