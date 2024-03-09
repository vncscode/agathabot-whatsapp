const axios = require('axios');
var regex = /= \{"responseContext":\{(.+?)\};/gi;


function ytSearch(search) {
return new Promise(async(resolve, reject) => {
var url = `https://m.youtube.com/results?sp=mAEA&search_query=${encodeURIComponent(search.split("?si=")[0])}`
axios({
  url: url,
  method: "GET",
  headers: {
   'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
   'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
   'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
  }
})
.then(({data}) => {
   var jsonBody = JSON.parse(data.match(regex)[0].split('= ').join('').split(';').join(''));
   var result = [];
   var videos = jsonBody?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents; // INFORMAÇÕES DOS VÍDEOS
    for (let i of videos) {
     if (Object.keys(i) == 'videoRenderer') {
      id = i?.videoRenderer?.videoId;
      titulo = i?.videoRenderer?.title?.runs[0]?.text.trim();
      tempo = i?.videoRenderer?.lengthText?.simpleText;
      thumb = i?.videoRenderer?.thumbnail?.thumbnails[0]?.url;
      publicado = i?.videoRenderer?.publishedTimeText?.simpleText;
      url = "https://youtube.com/watch?v=" + id;
      views = i?.videoRenderer?.shortViewCountText?.simpleText ? i?.videoRenderer?.shortViewCountText?.simpleText.replace(/ de visualizações| visualizações/gi, "") : "";
      views_detail = i?.videoRenderer?.viewCountText?.simpleText ? Number(i?.videoRenderer?.viewCountText?.simpleText?.replace(/\D+/gi, '')) : "";
      canal = {
       nome: i?.videoRenderer?.ownerText?.runs[0]?.text,
       url: "https://youtube.com" + i?.videoRenderer?.ownerText?.runs[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url
      };

     dados = {
      id,
      url,
      titulo,
      tempo,
      thumb,
      publicado,
      views,
      views_detail,
      canal
     };
     result.push(dados);
    };
   };
    resolve(result);
  }).catch(err => {
   resolve({erro: "ops, sistema parece estar off", error: String(err)});
   reject(err);
  });
 });
};


const headers = {
  'accept': '*/*',
  'accept-language': 'pt-BR,pt;q=0.9',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest'
};
    
 async function post(formdata) {
  return await axios("https://www.y2mate.com/mates/analyzeV2/ajax", {
    method: 'POST',
    headers,
    data: formdata
  });
 }; 

 function downY2mate(query, type) {
  return new Promise(async(resolve, reject) => {

    const { data } = await post(`k_query=${encodeURIComponent(query[0].url)}&k_page=home&hl=en&q_auto=0`);

     let infoVideos = Object.values(data.links.mp4)
      .sort((a, b) => {
        if (parseInt(a.q) > parseInt(b.q)) return -1;
         return 1;
      });

    let removeAutoSelect = infoVideos.indexOf(infoVideos.find(({q, size}) => (q === "auto" || size === "MB" || size === "")));
     if (removeAutoSelect === -1) return;
     infoVideos.splice(removeAutoSelect, 1);

    let detectTamanho = infoVideos.filter(({size}) => size.replace(/\D+/g, "") < 940);
      
    let formInput;
    
    if (type == "mp3") {
      formInput = detectTamanho[0];
    };
    if (type == "mp4") {
      formInput = infoVideos.find(e => (
        e.q === '1080p' || e.q === '720p' || e.q === '480p' || e.q === '360p' || e.q === '240p' || e.q === '144p' //|| e.q === 'auto'
      ));
    };

     let response = await axios({
       url: 'https://www.y2mate.com/mates/convertV2/index',
       method: "POST",
       headers,
       data: `vid=${data.vid}&k=${encodeURIComponent(formInput.k)}`
     })

    response.data.thumb = query[0].thumb;
    response.data.views = query[0].views;
    response.data.tempo = query[0].tempo;
    response.data.publicado = query[0].publicado;
    response.data.autor = query[0].canal.nome;
    response.data.aviso = infoVideos.filter(({ size }) => size.replace(/\D+/g, "") > 940).length > 0 ? "Devido ao tamanho da mídia, reduzi a qualidade, então pode não ficar tão boa." : "Sem aviso :)";

    resolve(response.data);
  });
 };

 function downY2mateMp3(query) {
  return new Promise(async(resolve, reject) => {
    const { data } = await post(`k_query=${encodeURIComponent(query[0].url)}&k_page=home&hl=en&q_auto=0`);

    let response = await axios({
      url: 'https://www.y2mate.com/mates/convertV2/index',
      method: "POST",
      headers,
      data: `vid=${data.vid}&k=${encodeURIComponent(Object.values(data.links.mp3).find(({f}) => f === "mp3").k)}`
    });
 
    response.data.thumb = query[0].thumb;
    response.data.views = query[0].views;
    response.data.tempo = query[0].tempo;
    response.data.publicado = query[0].publicado;
    response.data.autor = query[0].canal.nome;
    //response.data.aviso = infoVideos.filter(({ size }) => size.replace(/\D+/g, "") > 940).length > 0 ? "Devido ao tamanho da mídia, reduzi a qualidade, então pode não ficar tão boa." : "Sem aviso :)";

    resolve(response.data);
  });
 };
 

 function y2mate_yt(query, type) {
  return new Promise(async(resolve, reject) => {
   let jsonVid = await ytSearch(query);
 
   if (type === "mp3_2") {
    downY2mateMp3(jsonVid)
     .then((response) => {
       resolve(response);
     })
     .catch((err) => console.log("yt-down-Er:", err.message));
    return;
   };
   downY2mate(jsonVid, type)
    .then((response) => {
      resolve(response);
    })
    .catch((err) => console.log("yt-down-Er:", err.message));
  });
 };


module.exports = { y2mate_yt };

