const puppeteer = require("puppeteer");
const fs = require("fs");
var request = require("request");
const { v4: uuid_v4 } = require("uuid");
var https = require("https"),
  Stream = require("stream").Transform;
const { default: axios } = require("axios");

let scrape = async (link) => {
  // fazer login e gerar o token
  let token = "";

  const login = await axios({
    method: "POST",
    url: "https://emersongarrido.com.br/sexy/wp-json/jwt-auth/v1/token",
    data: {
      username: "username",
      password: "password",
    },
  }).then((res) => {
    token = res.data.data.token;
  });

  const browser = await puppeteer.launch({
    headless: false,
  });

  const page = await browser.newPage();

  await page.setViewport({
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
  });

  await page.goto(link);

  let haveNext = false;
  let links = [];
  let numberPage = 0;

  do {
    haveNext = false;
    const urls = await page.$$eval("div.videos > div > a", (el) => {
      return el.map((a) => a.getAttribute("href"));
    });

    links = links.concat(urls);

    const button_next_page = page.$eval("ul.paginacao > li.next > a");

    if (button_next_page === null) {
      await Promise.all([
        page.waitForNavigation(),
        page.$eval("ul.paginacao > li.next > a", (e) => e.click()),
      ]);
      haveNext = true;
      numberPage = numberPage + 1;
    }
  } while (haveNext);

  const posts = [];

  for (const url of links) {
    await page.goto(url);
    await page.waitForSelector("div.container > h1.post-titulo");
    const id = uuid_v4();
    const title = await page.$eval(
      "h1.post-titulo",
      (title) => title.innerText
    );
    await page.waitForSelector("img");
    const image = await page.$eval("img", (image) => image.getAttribute("src"));

    async function uploadImage() {
      var options = {
        method: "POST",
        url: "https://emersongarrido.com.br/sexy/wp-json/wp/v2/media",
        headers: {
          "postman-token": "9547fd9c-d965-ce60-a947-67ebfa71403e",
          "cache-control": "no-cache",
          authorization: "Bearer YOU BEAR TOKEN", // GET YOU BEAR TOKEN WORDPRESS
          "content-type":
            "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
        },
        formData: {
          file: {
            value: fs.createReadStream(`${id}.png`),
            options: {
              filename: `${id}.png`,
              contentType: null,
            },
          },
        },
      };

      request(options, async function (error, response, body) {
        if (error) throw new Error(error);
        const imageID = JSON.parse(response.body);

        let linkRegex = newLink.replace(/\/\?\/?embed.*/g, "");

        const registerVideo = await axios({
          method: "POST",
          url: "https://emersongarrido.com.br/sexy/wp-json/wp/v2/posts",
          headers: {
            Authorization: "Bearer YOU BEAR TOKEN", // GET YOU BEAR TOKEN WORDPRESS
          },
          data: {
            status: "publish",
            title: title,
            featured_media: imageID.id,
            video: video,
            content: `
            ${content} 
            <!-- wp:embed {"url":"${linkRegex}","type":"rich","providerNameSlug":"gestor-de-incorporacoes","responsive":true} -->
            <figure class="wp-block-embed is-type-rich is-provider-gestor-de-incorporacoes wp-block-embed-gestor-de-incorporacoes"><div class="wp-block-embed__wrapper">
            ${linkRegex}
            </div></figure>
            <!-- /wp:embed -->
            `,
            categories: 2,
          },
        });
      });
    }

    async function saveImage() {
      const save = await https
        .request(image, async function (response) {
          var data = new Stream();

          response.on("data", function (chunk) {
            data.push(chunk);
          });

          response.on("end", function () {
            fs.writeFileSync(`${id}.png`, data.read());
          });
        })
        .end();
      return save;
    }

    await saveImage().then(() => {
      console.log("gravou a imagem");
    });

    const video = await page.$eval("div.post-embed > iframe", (video) =>
      video.getAttribute("src")
    );

    const content = await page.$eval(
      "div.post-texto > p",
      (el) => el.innerText
    );

    const timmer = setInterval(() => {
      uploadImage();
      clearTimeout(timmer);
    }, 2000);

    await page.goto(video);

    await page.waitForSelector("div.fp-player");
    const newLink = await page.$eval("div.fp-player > video", (video) =>
      video.getAttribute("src")
    );

    const post = {
      id,
      title,
      image,
      video,
      newLink,
      content,
      publish: true,
    };
    posts.push(post);
  }
  browser.close();
  return posts;
};

const links = [
  "https://www.xvideos.com.br/porno-brasileiro/page/41/",
  "https://www.xvideos.com.br/porno-brasileiro/page/42/",
  "https://www.xvideos.com.br/porno-brasileiro/page/43/",
  "https://www.xvideos.com.br/porno-brasileiro/page/44/",
  "https://www.xvideos.com.br/porno-brasileiro/page/45/",
  "https://www.xvideos.com.br/porno-brasileiro/page/46/",
  "https://www.xvideos.com.br/porno-brasileiro/page/47/",
  "https://www.xvideos.com.br/porno-brasileiro/page/48/",
  "https://www.xvideos.com.br/porno-brasileiro/page/49/",
  "https://www.xvideos.com.br/porno-brasileiro/page/50/",
];

for (const url in links) {
  scrape(links[url])
    .then((value) => {
      fs.writeFileSync("save.json", JSON.stringify(value));
      console.log("...Feito");
    })
    .catch((error) => console.log(error));
}
