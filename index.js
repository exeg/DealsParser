const cheerio = require('cheerio');
const request = require('requestretry');
const fs = require('fs');
//const puppeteer = require('puppeteer');
const http = require('http');


const ApiKey = "x4TzMwjmdangt7AQ";
let finResult = {};



function getUrl () {
  if (process.argv.length < 3) {
	console.log('Usage: node ' + process.argv[1] + ' URL');
	process.exit(1);
  }

  const parseUrl = process.argv[2];
  //console.log(parseUrl);
  let obj ={};
  if (parseUrl.startsWith('https://www.walmart.com'))  {
	console.log("WALMART");
    obj = {
		shop: 1,
		url: parseUrl
	};
  }
  else if (parseUrl.startsWith('www.walmart.com')) {
    console.log("WALMART");
	  obj = {
	      shop: 1,
		  url: parseUrl
	  };
  }
  else if (parseUrl.startsWith('https://www.ebay.com/')) {
	console.log("EBAY");
      obj = {
	      shop: 2,
		  url: parseUrl
	  };
  }
  else if (parseUrl.startsWith('http://www.ebay.com')) {
    console.log("EBAY");
	obj = {
	    shop: 2,
		url: parseUrl
	};
  }
  else if (parseUrl.startsWith('https://intl.target.com')) {
	console.log("TARGET");
	obj = {
		shop: 3,
		url: parseUrl
	};
  }
  else {
	console.log("Not compatible");
	process.exit(1);
  }
  return obj;

}

async function parseWalmart(body) {
  let title, priceSave,fullPrice;
  const $ = cheerio.load(body);
  
  title = $('h1').text();
  priceSave = $('.Price-save-text').next().text();
  ///fullPrice = $('.prod-PriceHero').find('[role="contentinfo"]').eq(-1).text();
  fullPrice = $('.prod-PriceHero .Price-group').eq(1).text();
  categories = $('ol').text();
  let categoriesArr = categories.match(/[A-Z][a-z]+/g);//ElectronicsComputersLaptopsShop Laptops by TypeAll Laptop ComputersBest seller ranking:#471 inElectronics#142 inElectronicsComputers#9 inElectronicsComputersLaptops
  let half_length = Math.ceil(categoriesArr.length / 2);    
  let leftSide = categoriesArr.splice(0,half_length);
  leftSide.join(", ");

  finResult = {
  	title: title,
  	priceSave : priceSave,
  	fullPrice : fullPrice,
  	categories : leftSide,
  	shop : `from <a href="http://dea4.com/2k"> Walmart </a>.`,
    thoughts: `Free 2-Day Shipping on orders $35+`
  }

}

async function parseEbay(body) {
  let title, priceSave,fullPrice;
  const $ = cheerio.load(body);
  
  title = $('#itemTitle').text().replace("Details about","").trim();
  priceSave = $('#youSaveSTP').text().trim();
  fullPrice = $('#prcIsum').text().trim();
  categories = $('ul .bc-w').text().trim();
  //console.log(categories);
  let categoriesArr = categories.match(/[A-Z][a-z]+/g);//ElectronicsComputersLaptopsShop Laptops by TypeAll Laptop ComputersBest seller ranking:#471 inElectronics#142 inElectronicsComputers#9 inElectronicsComputersLaptops
  let half_length = Math.ceil(categoriesArr.length / 2);    
  let leftSide = categoriesArr.splice(0,half_length);
  leftSide.join(", ");
  finResult = {
    title: title,
    priceSave : priceSave,
    fullPrice : fullPrice,
    categories : leftSide,
    shop : `from <a href="http://dea4.com/ebay"> Ebay </a>.`,
    thoughts : `None`
  }


}



async function shortLink(sourceUrl) {

  const requestString = "/api.php?apikey=" + ApiKey + "&action=shorten&url=" + sourceUrl;
  

  const options = {
    hostname: 'dea4.com',
    path: requestString
  };

  return new Promise((resolve,reject) => {

    http.get(options, (res) => {
      const { statusCode } = res;
      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
      }
      if (error) {
        console.error(error.message);
        res.resume();
        return;
      }
      res.on('data', (chunk) => {
        resolve(chunk);
      })
    }).on('error', (e) => {
    console.error(`Got error: ${e.message}`)
    reject(e);
      });
  });

  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.goto('http://dea4.com/login.php');
  // const userInputElement = await page.$('#username');
  // await userInputElement.click();
  // page.type('Sunnyday1');
  // const passInputElement = await page.$('#password');
  // await passInputElement.click();
  // page.type('54321A');
  // const loginElement = await page.$('#submit');
  // await loginElement.click();
  // await page.waitForNavigation(5);
  // let urlInputElement = await page.$('#url');
  // urlInputElement.evaluate(urlInputElement => urlInputElement.value = '');
  // await urlInputElement.click();
  // //console.log(sourceUrl);
  // page.type(sourceUrl);
  // const shortenButton = await page.$('#shorten');
  // await shortenButton.click();
  // await page.waitForNavigation(5);
  // const resultUrl = await page.$('#i');
  
  // let resultUU = await resultUrl.evaluate((resultUrl) => {return resultUrl.value})
  // //await page.screenshot({path: 'example.png'});
  

  // browser.close();

 
}

async function getBody(url) {
  let opts = {
    Accept: '*/*',
    uri: url,
    fullResponse: false,
    maxAttempts: 5,
    retryStrategy: request.RetryStrategies.HTTPOrNetworkError,
    headers: {
    'User-Agent': 'runscope/0.1'
      }     
  };

  return await request(opts)
    .then(function (body) {
      return body;  
  })
  .catch(function(error) {
    console.log(error);
    //process.exit(1);
  })
  
};



async function main(obj, shortenLink) {
  const urlBody = await getBody(obj.url);
//console.log(urlBody); 
  switch (obj.shop) {
    case 1:    
      await parseWalmart(urlBody);
    break;
    case 2:
	    await parseEbay(urlBody);
    break;
    case 3:
	 // console.log("Bananas are $0.48 a pound.");
    default:
      console.log("Sorry, we are out.");
  };


  let final = `<ol>
  <li class="deal">*<a href="` + shortenLink +`"> Save ` + finResult.priceSave + ` ` + finResult.title + `</a> `+ finResult.shop +` Price: `+ finResult.fullPrice +`. Discount: `+ finResult.priceSave + 
  `. Categories: `+ finResult.categories + `. Deal Rating: 4 Stars out of 5. Store Rating: 5 Stars out of 5. Deal Recommendation: Recommended. Available Until: Not Specified. Thoughts: `+ finResult.thoughts + `</li>
</ol>`
  console.log(final);
}

async function startShow () {
  let urlObj = await getUrl();
  let shortenLink = await shortLink(urlObj.url);
  main(urlObj, shortenLink);      

}







startShow()