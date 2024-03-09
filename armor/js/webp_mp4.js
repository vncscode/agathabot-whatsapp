//=== CRIADO POR LORDGCS === \\

const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

 function webp_mp4(filePath) {
   return new Promise((resolve, reject) => {
     const formData = new FormData();

     formData.append('new-image-url', '');
     formData.append('new-image', fs.createReadStream(filePath));

     axios({
       method: 'POST',
       url: 'https://ezgif.com/webp-to-mp4',
       data: formData,
       headers: {
         'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
       }
     })
     .then(({ data }) => {
       const formData2 = new FormData();
       const $ = cheerio.load(data);
       const fileName = $('input[name="file"]').attr('value');

       formData2.append('file', fileName);

       axios({
         method: 'POST',
         url: 'https://ezgif.com/webp-to-mp4/' + fileName,
         data: formData2,
         headers: {
           'Content-Type': `multipart/form-data; boundary=${formData2._boundary}`
         }
       })
       .then(({ data }) => {
         const $2 = cheerio.load(data);
         resolve({
           url: 'https:' + $2('div#output > p.outfile > video > source').attr('src')
         });
       })
       .catch(e => resolve({
         erro: "Erro ao converter o WEBP para MP4!"
       }));
     })
     .catch(e => resolve({
       erro: "Erro ao fazer upload!"
     }));
   });
 };

module.exports = {
 webp_mp4
};
