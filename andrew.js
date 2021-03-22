export default { filter_soap2rest, proxy_rest2soap }

var res = "";
var buf = 0;
function filter_xml2json(r, data, flags) {
    if (data.length) buf++;
    res += data;      // Collect the entire response,
    if (flags.last) { //  until we get the last byte.
        try {
            var x = global.xmljs; // require("xml-js")
            var opts = {
                spaces: 4,
                compact: true,
                trim: true,
                nativeType: true,
                nativeTypeAttributes: true,
                ignoreDeclaration: true,
                ignoreInstruction: true
            };
            var j = x.xml2json(res.replace(/^\s+|\s+$/g, ""), opts); // Must strip trailing newlines, trim() is inadequate
            r.sendBuffer(j, flags);
            ngx.log(ngx.INFO, `FILTERED ${res.length} bytes in ${buf} buffers`);
        } catch (e) {
            ngx.log(ngx.ERR, `ERROR ${e}`);
            r.sendBuffer("", flags);
        }
    }
}

var countryTmpl = {
    "soapenv:Envelope": {
        "_attributes":{
            "xmlns:soapenv":"http://schemas.xmlsoap.org/soap/envelope/",
            "xmlns:gs":"http://spring.io/guides/gs-producing-web-service"
        },
        "soapenv:Header":{},
        "soapenv:Body":{
            "gs:getCountryRequest": {
                "gs:name": ""
            }
        }
    }
}

function proxy_rest2soap(r) {
    try {
        var x = global.xmljs; // require("xml-js")
        var proxyOpts = { args: r.args, method: r.method };
        if (typeof(r.requestBuffer) != "undefined") {
            countryName = r.requestBuffer.name
            var reqToSend = countryTmpl
            reqToSend["soapenv:Envelope"]["soapenv:Body"]["gs:getCountryRequest"]["gs:name"] = countryName
            var toXmlOpts = { spaces: 2, compact: true, indendAttribubtes: true, noQuotesForNativeAttributes: true }; // Must have compact: true
            proxyOpts.body = x.json2xml(reqToSend.toString(), toXmlOpts);
        }
        r.subrequest(r.variables.proxy_location, proxyOpts)
        .then(res => {
            var toJsonOpts = {spaces: 4, compact: true};
            //var json = x.xml2json(res.responseBody.replace(/^\s+|\s+$/g, ""), toJsonOpts);
            //r.headersOut["Content-Type"] = "application/json";
            r.return(res.status, res.responseBody);
        })
        .catch(e => r.return(500, e.message))
    } catch (e) {
        // This catches json2xml failures
        r.return(400, e);
    }
}
