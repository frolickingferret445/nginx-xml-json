export default { proxy_rest2soap }

var res = "";

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
            r.error(r.requestBuffer)
            r.error(r.requestBuffer["name"])
            r.error(typeof r.requestBuffer)
            for(var key in r.requestBuffer){
                r.error(key)
             }
            var countryName = r.requestBuffer.name
            var reqToSend = countryTmpl
            reqToSend["soapenv:Envelope"]["soapenv:Body"]["gs:getCountryRequest"]["gs:name"] = countryName
            var toXmlOpts = { spaces: 2, compact: true, indendAttribubtes: true, noQuotesForNativeAttributes: true }; // Must have compact: true
            r.error(reqToSend.toString())
            proxyOpts.body = x.json2xml(reqToSend.toString(), toXmlOpts);
            r.error(proxyOpts.body)
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
