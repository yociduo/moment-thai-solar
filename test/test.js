(function () {
    function append(string) {
        html += string + '<br>';
    }

    var html = '';
    var date = moment();
    append(date);
    append(date.format('YYYY/MM/DD'));
    append(date.format('LLLL'));
    append(date.format('LLL'));

    append(date.format('xkY/MM/DD'));

    date = moment('1940/01/02', 'YYYY/MM/DD');
    append(date.format('xkY/MM/DD'));

    date = moment('1940/04/02', 'YYYY/MM/DD');
    append(date.format('xkY/MM/DD'));

    date = moment('1941/01/02', 'YYYY/MM/DD');
    append(date.format('xkY/MM/DD'));

    date = moment('1912/04/02', 'YYYY/MM/DD');
    append(date.format('xkY/MM/DD'));

    date = moment('01/02/2482', 'MM/DD/xkY');
    append(date.format('YYYY/MM/DD'));

    date = moment('10/12/2482', 'MM/DD/xkY');
    append(date.format('YYYY/MM/DD'));

    date = moment('01/02/2483', 'MM/DD/xkY');
    append(date.format('YYYY/MM/DD'));

    date = moment('10/12/2483', 'MM/DD/xkY');
    append(date.format('YYYY/MM/DD'));

    date = moment('01/02/2484', 'MM/DD/xkY');
    append(date.format('YYYY/MM/DD'));

    date = moment('10/12/2484', 'MM/DD/xkY');
    append(date.format('YYYY/MM/DD'));

    document.getElementById('main').innerHTML = html;
}());