// Variáveis, requisitos e módulos 

const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

// POST
app.post('/tez', (req,res) => {
    let action = req.body.queryResult.action

    switch(action) {
        case 'simulacao_investimentos':
            let investimento_nome = req.body.queryResult.parameters.investimento.toLowerCase()
            let investimento_init = req.body.queryResult.parameters.init
            let investimento_valor_mensal = req.body.queryResult.parameters.valor_mensal
            let investimento_periodo = req.body.queryResult.parameters.periodo
            let url, json, valor, valor_tratado, acc

            if (investimento_periodo > 360) res.json({'fulfillmentText': 'Desculpe, mas o período máximo aceito é de 360 meses.'})

            if (investimento_nome == 'selic') url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json'
            else if (investimento_nome == 'cdb' || investimento_nome == 'lci') url = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.4392/dados?formato=json'
            else res.json({'fulfillmentText': 'Os investimentos que consigo calcular são somente Selic, CDB e LCI.'})

            fetch(url)
            .then(res => res.json())
            .then(out => {
                json = out[out.length-1]
                valor_tratado = parseFloat(json.valor)

                if (investimento_nome == 'selic') {
                    valor = (1 + valor_tratado / 1200).toFixed(4) // calcula a taxa por mês e depois o valor decimal, sem a porcentagem
                    investimento_nome = investimento_nome.charAt(0).toUpperCase() + investimento_nome.substr(1)
                } else if (investimento_nome == 'cdb') {
                    valor = (1 + ((valor_tratado / 100 * 1.15) / 12)).toFixed(4) 
                    investimento_nome = investimento_nome.toUpperCase()
                } else if (investimento_nome == 'lci') {
                    valor = (1 + ((valor_tratado / 100 * 0.98) / 12)).toFixed(4) 
                    investimento_nome = investimento_nome.toUpperCase()
                } 
                
                // controle das variáveis
                console.log('Entrou no cálculo.')
                console.log('Valor da taxa: ' + valor)
                
                acc = investimento_init * valor;

                for (i=0; i < investimento_periodo; i++) {
                    acc = ((acc * valor) + investimento_valor_mensal).toFixed(2);
                    console.log(i + ' mes ' + acc)
                }
                res.json({'fulfillmentText': 'Com ' + investimento_nome + ', você teria cerca de R$' + acc + ' nesses ' + investimento_periodo + ' meses. Lembrando que essa é uma estimativa fazendo uma média entre diversos produtos e oportunidades disponíveis que usam o índice escolhido. 😉'})
            })
            .catch(err => { throw err });
    }
})

// listen
app.listen(3000)