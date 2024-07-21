//MicroSevice related configurations

module.exports = {
    "endpoints": [
        {
            "path": "bank",
            "switch_type": "header",
            "switch_refid": "bankid",
            "strategy": {
                "ssfb": {
                    "proxy_url": "http://localhost:8890",
                    "proxy_key": false
                }
            }
        }
    ]
}