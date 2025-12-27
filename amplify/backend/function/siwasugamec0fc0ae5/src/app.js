/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/



const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const bodyParser = require('body-parser')
const express = require('express')

const ddbClient = new DynamoDBClient({ region: process.env.TABLE_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

let tableName = "scores";
if (process.env.ENV && process.env.ENV !== "NONE") {
  tableName = tableName + '-' + process.env.ENV;
}

const partitionKeyName = "id";
const sortKeyName = "timestamp";
const hasSortKey = sortKeyName !== "";

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

// ------------------------------
// GET /scores → スコア一覧取得
// ------------------------------
app.get("/scores", async function(req, res) {
  const params = {
    TableName: tableName,
    Select: 'ALL_ATTRIBUTES',
    Limit: 10,
  };

  try {
    const data = await ddbDocClient.send(new ScanCommand(params));

    // スコア順にソート（降順）
    const sorted = data.Items.sort((a, b) => b.score - a.score);

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: 'Could not load scores: ' + err.message });
  }
});

// ------------------------------
// POST /scores → スコア登録
// ------------------------------
app.post("/scores", async function(req, res) {
  const { id, score } = req.body;

  if (!id || score === undefined) {
    return res.status(400).json({ error: "id と score は必須です" });
  }

  const item = {
    id: id,
    score,
    timestamp: Date.now()
  };

  const params = {
    TableName: tableName,
    Item: item
  };

  try {
    await ddbDocClient.send(new PutCommand(params));
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ error: 'Could not save score: ' + err.message });
  }
});

app.listen(3000, function() {
  console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
