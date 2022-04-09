```
curl -X POST -H "Content-Type: application/json" https://buidl.vite.net/gvite  --data-binary @- << EOF
{
	"jsonrpc": "2.0",
	"id": 1,
	"method": "ledger_getVmLogsByFilter",
	"params": [{
		"addressHeightRange":{
			"vite_029b2a33f03a39009f96f141b7e1ae52c73830844f3b9804e8":{
				"fromHeight":"12796640",
				"toHeight":"12797640"
			}
		}
	}]
}
EOF

curl -X POST -H "Content-Type: application/json" https://buidl.vite.net/gvite  --data-binary @- << EOF
{
	"jsonrpc": "2.0",
	"id": 1,
	"method": "ledger_getVmLogsByFilter",
	"params": [{
		"addressHeightRange":{
			"vite_029b2a33f03a39009f96f141b7e1ae52c73830844f3b9804e8":{
				"fromHeight":"1",
				"toHeight":"10"
			}
		}
	}]
}
EOF

```