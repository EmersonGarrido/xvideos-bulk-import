var fs = require("fs");
var request = require("request");

var options = {
  method: "POST",
  url: "https://emersongarrido.com.br/sexy/wp-json/wp/v2/media",
  headers: {
    "postman-token": "9547fd9c-d965-ce60-a947-67ebfa71403e",
    "cache-control": "no-cache",
    authorization: "Bearer YOU-ACESS-TOKEN-BEAR", // GET  YOU TOKEN BEAR WORDPRESS
    "content-type":
      "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
  },
  formData: {
    file: {
      value: fs.createReadStream(
        "src/834dd147-fda4-4840-b188-9037e0787a41.png"
      ),
      options: {
        filename: "Captura de Tela 2021-09-18 às 20.19.41.png",
        contentType: null,
      },
    },
  },
};

request(options, function (error, response, body) {
  if (error) throw new Error(error);
});
