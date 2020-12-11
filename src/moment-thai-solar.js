(function (global, factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        // CMD
        module.exports = factory(require('moment'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as parrot
        // TODO how to define the jquery plugin here?
        define(['moment'], factory);
    } else {
        // in browser, assump moment is loaded
        global.moment = factory(moment);
    }
}(typeof window !== "undefined" ? window : this, function (moment) {
    // utils
    var thai = {
        /*
         Converts a Gregorian date to Thai.
         */
        toThai: function (gYear, month, day) {
            return {
                year: gYear + 543,
                month: month,
                day: day
            };
        },
        /*
         Converts a Thai date to Gregorian.
         */
        toGregorian: function (tYear, month, day) {
            return {
                year: utils.calYear(tYear),
                month: month,
                day: day
            };
        },
        /**
         * Checks whether a Thai date is valid or not.
         */
        isValidDate: function (tYear, month, day) {
            return month >= 1 && month <= 12 &&
                day >= 1 && day <= utils.monthLength(tYear, month);
        },
        /**
         * check the Gregorian year is leap or not
         * @param gy
         * @returns {boolean}
         */
        isLeapYear: function isLeapYear(gy) {
            return ((gy % 4 == 0) && (gy % 100 != 0)) || (gy % 400 == 0);
        },
        /**
         * Is this a leap year or not?
         * @returns {boolean}
         */
        isLeapThaiYear: function isLeapThaiYear(tYear) {
            return utils.thaiCal(tYear).leap;
        },
        /**
         * Number of days in a given month in a Thai year.
         * @returns {number} days of month
         */
        monthLength: function (tYear, month) {
            switch (month) {
                case 4:
                case 6:
                case 9:
                case 11:
                    return 30;
                case 2:
                    return utils.isLeapYear(utils.calYear(tYear)) ? 29 : 28;
                default:
                    return 31;
            }
        },
        /**
         *
         * @param tYear thai year
         * @returns {{leap: boolean, gy: number}}
         */
        thaiCal: function thaiCal(tYear) {
            var gy = calYear(tYear);
            return {
                leap: isLeapYear(gy),
                gy: gy
            };
        },
        /**
         * calculate the Thai year to Gregorian year
         * @param tYear
         * @returns {number}
         */
        calYear: function calYear(tYear) {
            return tYear - 543;
        }
    };

    /************************************
     Constants
     ************************************/
    var formattingTokens = /xkY|xky|YY(YY)?|Q|MM?|MMMM?|DD?|Do|DDDD?|X|x|gg(gg)?|ww?|e|dddd?|GG(GG)?|WW?|E|HH?|hh?|a|A|mm?|ss?|SS?S?S?|ZZ?|./g;
    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        parseTokenOneOrTwoDigits = /\d\d?/,
        parseTokenOneToThreeDigits = /\d{1,3}/,
        parseTokenThreeDigits = /\d{3}/,
        parseTokenFourDigits = /\d{1,4}/,
        parseTokenSixDigits = /[+\-]?\d{1,6}/,
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/i,
        parseTokenT = /T/i,
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/,

        formatFunctions = {},
        formatTokenFunctions = {
            xkY: function () {
                return this.thaiYear() + '';
            },
            xky: function () {
                return this.thaiYear() % 100 + '';
            }
        };

    /************************************
     Helpers
     ************************************/
    var extend = function (a, b) {
        var key;
        for (key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        return a;
    };

    var setDate = function (m, year, month, date) {
        var d = m._d;
        if (m._isUTC) {
            /*eslint-disable new-cap*/
            m._d = new Date(Date.UTC(year, month, date,
                d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()));
            /*eslint-enable new-cap*/
        } else {
            m._d = new Date(year, month, date,
                d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds());
        }
    };

    var objectCreate = function (parent) {
        function F() {}

        F.prototype = parent;
        return new F();
    };

    /************************************
     Formatting
     ************************************/
    var makeFormatFunction = function (format) {
        var array = format.match(formattingTokens);
        var length = array.length;
        var i;

        array.forEach(function (element, index) {
            if (formatTokenFunctions[element]) {
                array[index] = formatTokenFunctions[element];
            }
        });

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i += 1) {
                output += array[i] instanceof Function ? '[' + array[i].call(mom, format) + ']' : array[i];
            }
            return output;
        };
    };

    /************************************
     Parsing
     ************************************/
    /**
     * get parse regex for token
     * @param token
     * @param config
     * @returns {*}
     */
    var getParseRegexForToken = function (token, config) {
        switch (token) {
            case 'DDDD':
                return parseTokenThreeDigits;
            case 'xkY':
            case 'YYYY':
                return parseTokenFourDigits;
            case 'YYYYY':
                return parseTokenSixDigits;
            case 'S':
            case 'SS':
            case 'SSS':
            case 'DDD':
                return parseTokenOneToThreeDigits;
            case 'MMM':
            case 'MMMM':
            case 'dd':
            case 'ddd':
            case 'dddd':
                return parseTokenWord;
            case 'a':
            case 'A':
                return moment.localeData(config.lang)._meridiemParse;
            case 'X':
                return parseTokenTimestampMs;
            case 'Z':
            case 'ZZ':
                return parseTokenTimezone;
            case 'T':
                return parseTokenT;
            case 'MM':
            case 'DD':
            case 'xky':
            case 'YY':
            case 'HH':
            case 'hh':
            case 'mm':
            case 'ss':
            case 'M':
            case 'D':
            case 'd':
            case 'H':
            case 'h':
            case 'm':
            case 's':
                return parseTokenOneOrTwoDigits;
            default:
                return new RegExp(token.replace('\\', ''));
        }
    };

    var addTimeToArrayFromToken = function (token, input, config) {
        switch (token) {
            case 'xkY':
                config._thaiYear = ~~input;
                break;
        }
        if (input == null) {
            config._isValid = false;
        }
    };

    /**
     * get thai year from config
     * @param config
     * @returns {*}
     */
    var yearFromConfig = function (config) {
        return config._thaiYear;
    };

    /**
     *
     * @param config
     * @returns {[]}
     */
    var makeDateFromStringAndFormat = function (config) {
        var tokens = config.format.match(formattingTokens);
        var string = config.input + '';

        config._a = [];

        tokens.forEach(function (token) {
            var parsedInput = (getParseRegexForToken(token, config).exec(string) || [])[0];
            if (parsedInput) {
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
            }
            if (formatTokenFunctions[token]) {
                addTimeToArrayFromToken(token, parsedInput, config);
            }
        });
        if (string) {
            config._thai_leftLength = string;
        }
        return yearFromConfig(config);
    };

    /**
     * create moment by given configuration with multiple formats.
     * score of moment is left length of formatting. return moment object with minimum score.
     * @param config
     * @param utc
     * @returns {*}
     */
    var makeDateFromStringAndArray = function (config, utc) {
        if (config.format.length === 0) {
            return makeMoment(new Date(NaN));
        }

        var moments = config.format.map(function (format) {
            var currentScore = 0;
            var tempMoment = makeMoment(config.input, format, config.lang, config.strict, utc);
            if (tempMoment.isValid()) {
                if (tempMoment._thai_leftLength) {
                    currentScore += tempMoment._thai_leftLength.length;
                }
            }
            return {
                score: currentScore,
                moment: tempMoment
            };
        });
        moments.sort(function (m1, m2) {
            return m1.score - m2.score;
        });
        return moments[0].moment;
    };

    var removeParsedTokens = function (config) {
        var string = config.input + '';
        var input = '';
        var format = '';
        var array = config.format.match(formattingTokens);

        array.forEach(function (match) {
            var parsed = (getParseRegexForToken(match, config).exec(string) || [])[0];
            if (parsed) {
                string = string.slice(string.indexOf(parsed) + parsed.length);
            }
            if (!(formatTokenFunctions[match] instanceof Function)) {
                format += match;
                if (parsed) {
                    input += parsed;
                }
            }
        });
        config.input = input;
        var orgFormat = config.format;
        config.format = format;
        return orgFormat != format;
    };

    /************************************
     Top Level Functions
     ************************************/
    var makeMoment = function (input, format, lang, strict, utc) {
        if (typeof lang === 'boolean') {
            utc = strict;
            strict = lang;
            lang = undefined;
        }
        var config = {
            input: input,
            format: format,
            lang: lang,
            strict: strict,
            utc: utc
        };
        var origInput = input;
        var origFormat = format;


        if (format) {
            if (Array.isArray(format)) {
                // create moment by given multiple formats
                return makeDateFromStringAndArray(config, utc);
            } else {
                // create moment by given single format
                var year = makeDateFromStringAndFormat(config);
                var removed = removeParsedTokens(config);
                if (removed) {
                    format = 'YYYY-' + config.format;
                    // has thai format
                    if (typeof year === 'undefined') {
                        // no year parsed, let it be invalid
                        input = 'ABCD-' + config.input;
                    } else {
                        input = thai.calYear(year) + '-' + config.input;
                    }
                } else {
                    // keep original
                    format = origFormat;
                    input = origInput;
                }
                // format = 'YYYY-' + config.format;
                // input = thai.calYear(year) + '-' + config.input;
            }
        }

        var orgMoment;
        if (utc)
            orgMoment = moment.utc(input, format, lang, strict);
        else
            orgMoment = moment(input, format, lang, strict);
        if (config._isValid === false) {
            orgMoment._isValid = false;
        }
        var newMoment = objectCreate(thaiMoment.fn);
        extend(newMoment, orgMoment);
        if (strict && newMoment.isValid()) {
            newMoment._isValid = newMoment.format(origFormat) === origInput;
        }
        return newMoment;
    };

    var thaiMoment = function (input, format, lang, strict) {
        return makeMoment(input, format, lang, strict, false);
    };

    extend(thaiMoment, moment);
    thaiMoment.fn = objectCreate(moment.fn);

    thaiMoment.utc = function (input, format, lang, strict) {
        return makeMoment(input, format, lang, strict, true);
    };

    thaiMoment.unix = function (input) {
        return makeMoment(input * 1000);
    };

    /************************************
     thaiMoment Prototype
     ************************************/

    thaiMoment.fn.format = function (format) {
        var i, replace, me = this;
        if (format) {
            i = 5;
            replace = function (input) {
                return me.localeData().longDateFormat(input) || input;
            };
            while (i > 0 && localFormattingTokens.test(format)) {
                i -= 1;
                format = format.replace(localFormattingTokens, replace);
            }
            if (!formatFunctions[format]) {
                formatFunctions[format] = makeFormatFunction(format);
            }
            format = formatFunctions[format](this);
        }
        return moment.fn.format.call(this, format);
    };

    thaiMoment.fn.thaiYear = function (input) {
        var lastDay, thai, gregorian;
        if (typeof input === 'number') {
            thai = toThai(this.year(), this.month(), this.date());
            lastDay = Math.min(thai.year, thaiMoment.thaiDaysInMonth(input, thai.month));
            gregorian = toGregorian(input, thai.month, lastDay);
            setDate(this, gregorian.year, gregorian.month, gregorian.day);
            moment.updateOffset(this);
            return this;
        } else {
            return toThai(this.year(), this.month(), this.date()).year;
        }
    };

    thaiMoment.fn.clone = function () {
        return thaiMoment(this);
    };

    /************************************
     thaiMoment Statics
     ************************************/
    thaiMoment.thaiDaysInMonth = function (year, month) {
        year += div(month, 12);
        month = mod(month, 12);
        if (month < 0) {
            month += 12;
            year -= 1;
        }
        return thai.monthLength(year, month);
    };

    thaiMoment.thaiIsLeapYear = thai.isLeapYear;

    thaiMoment.thaiConvert = {
        toThai: toThai,
        toGregorian: toGregorian
    };

    /************************************
     Thai Conversion
     ************************************/
    var toThai = function (gy, gm, gd) {
        var date = thai.toThai(gy, gm + 1, gd);
        date.month -= 1;
        return date;
    };

    var toGregorian = function (jy, jm, jd) {
        var date = thai.toGregorian(jy, jm + 1, jd);
        date.month -= 1;
        return date;
    };

    /*
     Utility helper functions.
     */

    var div = function (a, b) {
        return ~~(a / b);
    };

    var mod = function (a, b) {
        return a - ~~(a / b) * b;
    };

    return thaiMoment;
}));