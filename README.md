# SmartCity

Protótipo de jogo de construção de cidade com atividades para aprender inglês, feito com HTML, CSS e JavaScript.

## Funcionalidades atuais

- Cidade em grade fixa 6 × 6.
- Compra e posicionamento de Casa, Loja, Escola e Parque.
- Remoção de construções após confirmação, com reembolso de 50% do preço arredondado para baixo, respeitando o limite de moedas.
- Saldo inicial de 100 moedas e limite de 500.
- Cada Loja gera 2 moedas por minuto enquanto o jogo está aberto.
- Recuperação de 20 moedas uma vez por dia quando o saldo não permite comprar a construção mais barata.
- Salvamento local do saldo, XP, construções, atividades recompensadas, áudio e data da última recuperação.
- 30 atividades de múltipla escolha, associação palavra-imagem e diálogos, abertas ao selecionar uma Escola.
- Recompensa de 20 moedas e 10 XP na primeira resposta correta de cada atividade.
- Áudio opcional de pronúncia pelo recurso de voz do navegador.

Os valores de economia ficam em `src/js/game/config.js`. Os dados das construções ficam em `src/data/buildings.json`.
O conteúdo em `src/data/questions.json` está marcado como rascunho e precisa de revisão pedagógica antes de ser usado com crianças. Salvamentos anteriores são preservados; XP, atividades recompensadas e preferência de áudio começam com valores padrão na primeira atualização.

## Executar

Na pasta do projeto, inicie um servidor estático:

```powershell
python -m http.server 8000 --directory src
```

Abra `http://localhost:8000` no navegador.

## Testes

```powershell
npm test
```

Não são necessárias bibliotecas externas para executar o protótipo.
