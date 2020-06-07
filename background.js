// ***** Changed from Local Storage to chrome.storage *****
var timer = null;
var globalObj = {};
var extStorageKeys = [];


function initStorage() {
    getValuesFromStorage(function(){
        pageLoaded();
        recursiveLoader();
    })
}

function getKeys(callback){
    chrome.storage.local.get('keys', function(o){
        extStorageKeys = o['keys'] || "[]";
        try{
            extStorageKeys = JSON.parse(extStorageKeys);
        } catch(err) {
            console.log(err);
        }
        if(typeof callback == 'function') callback();
    })
}

function recursiveLoader() {
    if(timer) clearInterval(timer);
    timer = setInterval(getValuesFromStorage, 1000);
}

function setItem(a, b) {
    globalObj[a] = b;
    var obj = {};
    obj[a] = b;
    chrome.storage.local.set(obj);
    if(extStorageKeys.indexOf(a) == -1){
        extStorageKeys.push(a);
    }
    chrome.storage.local.set({keys: JSON.stringify(extStorageKeys)});
    // writeToFile(globalObj);
}

function getItem(a) {
    var b = globalObj[a];
    if(b != undefined){
        return b;
    } else {
        return null;
    }
}

function removeItem(a) {
    delete globalObj[a];
    if(extStorageKeys.indexOf(a) > -1) {
        extStorageKeys.splice(extStorageKeys.indexOf(a), 1);
        chrome.storage.local.set({keys: JSON.stringify(extStorageKeys)});
    }
    chrome.storage.local.remove(a);
    // writeToFile(globalObj);
}

function getValuesFromStorage(callback) {
    getKeys(function(){
        getStorageObjFromKeys(0, function(){
            if(typeof callback == 'function') callback();
        });
    })
}

function getStorageObjFromKeys(idx, callback) {
    var key = extStorageKeys[idx];
    if(key) {
        chrome.storage.local.get(key, function(o){
            globalObj[key] = o[key];
            idx++;
            getStorageObjFromKeys(idx, callback);
        })
    } else {
        if(typeof callback == 'function') callback();
    }
}

// **********************************

chrome.runtime.onStartup.addListener(function(win){
  // if (localStorage.getItem('proxyMode') == "on"){    // Converted from Local storage to chrome.storage
  //   chrome.browserAction.setIcon({path : "images/ic24_on.png" });
  //   // alert(localStorage.getItem('proxyMode'));
  // }else{
  //   chrome.browserAction.setIcon({path : "images/ic24_off.png" });
  //   // alert("Proxy OFF1");
  // }
  updateIcons();
}); 
////added by youssef////////////////////
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    // alert("Proxy disable message received");
    console.log(sender)
    if (request.greeting == "HiProxy") {
      // var value = localStorage.getItem('proxyMode');  // Converted from Local storage to chrome.storage
      var value = getItem('proxyMode');
      sendResponse({proxyMode: value});
    }else if(request.greeting == "enableProxy"){
      console.log("TESTTESTENABLEPROXY")
      // localStorage.setItem('proxyMode', 'on');    // Converted from Local storage to chrome.storage
      setItem('proxyMode', 'on');
      chrome.browserAction.setIcon({path : "images/ic24_on.png" });      
      startTheProxy();
      // chrome.runtime.sendMessage({greeting: "proxy_enable"}, function(response) {

      // });
    }else if(request.greeting == "disableProxy"){
      // chrome.runtime.sendMessage({greeting: "proxy_disable"}, function(response) {

      // });
      // localStorage.setItem('proxyMode', 'off');    // Converted from Local storage to chrome.storage
      setItem('proxyMode', 'off');
      stopTheProxy();
      chrome.browserAction.setIcon({path : "images/ic24_off.png" });
    }else if(request.greeting == "GetCurrentCountry"){
        // let currentCountryFromLS = localStorage.getItem('countryId');   // Converted from Local storage to chrome.storage
        let currentCountryFromLS = getItem('countryId');
        sendResponse({currentCountry: currentCountryFromLS});
    }else if (request.greeting == "changeCountry"){
        //stopTheProxy();
        let newCountry  = request.countryName;
        // localStorage.setItem('countryId', newCountry);    // Converted from Local storage to chrome.storage
        setItem('countryId', newCountry);
        startTheProxy();
    }
  });
  ////addded by youssef



////COPIED AND MODIFIED BY YOUSSEF FROM TOGGLE.JS////
chrome.tabs.onUpdated.addListener(function(tab){
  var tabId = tab.id;

  // if (localStorage.getItem('proxyMode') == "on"){       // Converted from Local storage to chrome.storage
  //     chrome.browserAction.setIcon({tabId:tabId, path : "images/ic24_on.png"});
  // }else{
  //     chrome.browserAction.setIcon({tabId:tabId, path : "images/ic24_off.png"});
  // }
  updateIcons();
});



/*
* if google autosuggest or autocomplete is on, then the following code does not work properly when proxyMode is partiallyOn
* Eg: if user types aol it immediately hits google server for autosuggest and mustEnableProxy function below returns true since,
* google is in proxyEnabledSites list. This connects thru proxy for aol.com which is wrong.
* Autosuggest is disabled in epic so no prob currently.
*/


//infospace - inspcloud.com
var proxyEnabledSites = ['infospace.com','google.com','google.co.in', 'inspcloud.com','dogpile.com', 'ixquick.com', 'google.co.uk', 'bing.com', 'duckduckgo.com', 'yandex','yandex.com','yandex.ru','yandex.rt', 'epicsearch.in', 'google.com', 'naver.com', 'naver.net','daum.net', 'daumcdn.net' ,'blekko.com', 'nate.com', 'baidu.com', 'ask.com', 'sogou.com', 'soso.com', 'so.com', 'sezname.cz', 'vinden.nl', 'onet.pl'];
var proxyExceptionSites = ['mail.google.com', 'plus.google.com', 'play.google.com', 'news.google.com', 'maps.google.com', 'maps.static.com', 'mts1.google.com', 'mts0.google.com', 'googleusercontent.com', 'ytimg.com', 'drive.goo'];


var rand = 80;


var proxy_utils = {
  list_visisted: [],
  isTabvisited: function (d) {
      //Here we have to check for repeted url
      //if(this.list_visisted[i].tabId==d.tabId && this.list_visisted[i].url ==d.url)
      for (var i = 0; i < this.list_visisted.length; i++)
          if (this.list_visisted[i].tabId == d.tabId && this.list_visisted[i].enabled == false)
              return true;
      return false;

  },
  get_stripped_url: function (url) {
      var taburl;
      taburl += url;
      taburl = taburl.match(/^[\w-]+:\/*\[?([\w\.:-]+)\]?(?::\d+)?/)[1];
      return taburl;
  }

};

var proxy = {
  globalTabUrl: "",
  checkAndEnableProxy: function (obj) {
      if (!proxy_utils.isTabvisited(obj)) {

          obj.enabled = proxy.mustEnableProxy(obj.url);
          // if(obj.url=='google.co.in'){
          //     alert("yes Im google.co.in")
          // }
          // alert("here " +obj.url)
          console.log('At mustEnableProxy' + obj.enabled)
          return obj.enabled
      }
      return false;
  },

  getEpicDomain: function (t) {
      mm = t.replace('||', '').replace('@@', '').replace('-', '').match(/^([\w]+:\/{0,2})?([\w]+\.|.*@)?([\w]+\.[\w]{2,3})(\/?)(.*)?(^)?/);
      if ((mm && mm[3]) != null) {


          return (mm && mm[3]);
      } else if ((mm && mm[3]) == null) {
          //Not a proper Domain
          //Goes to others
      }
      return "sorry";
  },

  mustEnableProxy: function (url) {

      for (var i = 0; i < proxyExceptionSites.length; i++) {

          if (url.indexOf(proxyExceptionSites[i]) != -1) {

              return false
          }

      }



      kf = proxy.getEpicDomain(url);

      if(kf.indexOf('yandex') > -1)
          return true;


      if (kf.indexOf('mail') > -1)
          return false;
      for (var i = 0; i < proxyEnabledSites.length; i++) {
          if (url.indexOf("google.com") > -1) {
              //IF http req is google/ gstatic and tab url is google.com
              //return true;

              var fk = proxy.getEpicDomain(proxy.globalTabUrl)
            //  alert(fk)
              //console.log('uk check :'+ url)
              if (fk == "google.com" || fk == "gstatic.com" || fk == "google.co" || fk=="www.google.com") {
                  return true;
               } //else {
              //     return false;
   

          }
          console.log("fake car: "+kf)
          if (kf == proxyEnabledSites[i] ||kf == 'google.co' || fk == "google.com" || kf == "gstatic.com" )
              return true;


      }

      return false;
  },

  proxySettings: function (config) {
      chrome.proxy.settings.set({
          value: config,
          scope: 'regular'
      }, function () {});
  },    
  connect_use: function (){
       var config_use_epicbrowser_com = {
           mode: "pac_script",
           pacScript: {
              data: "function FindProxyForURL(url, host) {\n" +
               "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                    "return 'HTTPS theepicbrowser.com:8888; DIRECT;';\n" +
                 "return 'HTTPS theepicbrowser.com:8888;HTTPS backup.theepicbrowser.com:8888;';\n" +

              "}"
          }
      };

        proxy.proxySettings(config_use_epicbrowser_com);
        //alert('connected to use');
    },

    connect_use2ndServer: function (){
         var config_connect_use2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS use.theepicbrowser.com:8888; DIRECT';\n" +
                "   return 'HTTPS use.theepicbrowser.com:8888;HTTPS backup.theepicbrowser.com:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_connect_use2ndServer_epicbrowser_com);
        //alert('connected to use');
    },
    connect_use3rdServer: function (){
         var config_connect_use3rdServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS use2.theepicbrowser.com:8888; DIRECT';\n" +
                "   return 'HTTPS use2.theepicbrowser.com:8888;HTTPS backup.theepicbrowser.com:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_connect_use3rdServer_epicbrowser_com);
        //alert('connected to use');
    },
    connect_use4thServer: function (){
         var config_connect_use4thServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS use3.theepicbrowser.com:8888; DIRECT';\n" +
                "   return 'HTTPS use3.theepicbrowser.com:8888;HTTPS backup.theepicbrowser.com:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_connect_use4thServer_epicbrowser_com);
        //alert('connected to use');
    },
    // ***** USE Servers ***** <<<
    // ***** USW Servers ***** >>>
    connect_usw: function (){
         var config_usw_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS usw.theepicbrowser.com:8888;DIRECT;';\n" +
                 "return 'HTTPS usw.theepicbrowser.com:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_usw_epicbrowser_com);
       // alert('connected to france');



    },
    connect_usw2ndServer: function (){
         var config_usw2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS usw2.theepicbrowser.com:8888;DIRECT;';\n" +
                "   return 'HTTPS usw2.theepicbrowser.com:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_usw2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** USW Servers ***** <<<
    // ***** Singapore Servers ***** >>>
    connect_singapore: function (){
         var config_singapore_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS sg.epicbrowser.net:8888;DIRECT;';\n" +
                 "return 'HTTPS sg.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_singapore_epicbrowser_com);
        //alert('connected to singapore');
    },

    connect_singapore2ndServer: function (){
         var config_singapore2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS sg2.epicbrowser.net:8888;DIRECT;';\n" +
                "   return 'HTTPS sg2.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_singapore2ndServer_epicbrowser_com);
        //alert('connected to singapore');
    },
    // ***** Singapore Servers ***** <<<
    // ***** UK Servers ***** >>>
    connect_uk: function (){
         var config_global_epicbrowser_net = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS uk.epicbrowser.net:8888;DIRECT;';\n" +
                 "return 'HTTPS uk.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_global_epicbrowser_net);
        //alert('connected to uk');
    },
    connect_uk2ndServer: function (){
         var config_uk2ndServer_epicbrowser_net = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS uk2.epicbrowser.net:8888;DIRECT;';\n" +
                "   return 'HTTPS uk2.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_uk2ndServer_epicbrowser_net);
        //alert('connected to uk');
    },
    // ***** UK Servers ***** <<<
    // ***** France Servers ***** >>>
    // Got some issue with this server, couldn't able to login, so we are distributing the traffic of frace in between
    // 50% traffic to the fr.epicbrowser.net and 50% to the fr2.epicbrowser.net
    // connect_france: function (){
    //      var config_fr_epicbrowser_com = {
    //          mode: "pac_script",
    //          pacScript: {
    //             data: "function FindProxyForURL(url, host) {\n" +
    //              "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
    //                   "return 'DIRECT;';\n" +
    //              "else if(host == 'www.epicsearch.in') \n" +
    //                   "return 'fr.epicbrowser.com:8888;DIRECT;';\n" +
    //              "return 'HTTPS fr.epicbrowser.com:8888;';\n" +
 
    //             "}"
    //         }
    //     };

    //     proxy.proxySettings(config_fr_epicbrowser_com);
    //    // alert('connected to france');
    // },
    // ***********************************************
    connect_france2ndServer: function (){
         var config_fr2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'fr.epicbrowser.net:8888;DIRECT;';\n" +
                "   return 'HTTPS fr.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_fr2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    connect_france3rdServer: function (){
         var config_fr3rdServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'fr2.epicbrowser.net:8888;DIRECT;';\n" +
                "   return 'HTTPS fr2.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_fr3rdServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** France Servers ***** <<<
    // ***** Germany Servers ***** >>>
    connect_germany: function (){
         var config_de_epicbrowser_cm = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS de.theepicbrowser.com:8888;DIRECT;';\n" +
                 "return 'HTTPS de.theepicbrowser.com:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_de_epicbrowser_cm);
        //alert('connected to germany');
    },
    connect_germany2ndServer: function (){
         var config_de2ndServer_epicbrowser_cm = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS de2.theepicbrowser.com:8888;DIRECT;';\n" +
                "   return 'HTTPS de2.theepicbrowser.com:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_de2ndServer_epicbrowser_cm);
        //alert('connected to germany');
    },
    // ***** Germany Servers ***** <<<
    // ***** Italy Servers ***** >>>
    connect_italy: function (){
         var config_it_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS it.epicbrowser.com:44300;DIRECT;';\n" +
                 "return 'HTTPS it.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_it_epicbrowser_com);
       // alert('connected to france');
    },
    connect_italy2ndServer: function (){
         var config_it2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS it2.epicbrowser.com:44300;DIRECT;';\n" +
                "   return 'HTTPS it2.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_it2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** Italy Servers ***** <<<
    // ***** Canada Servers ***** >>>
        connect_canada: function (){
         var config_ca_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS ca.epicbrowser.net:8888;DIRECT;';\n" +
                 "return 'HTTPS ca.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_ca_epicbrowser_com);
        //alert('connected to canada');
    },
    connect_canada2ndServer: function (){
         var config_ca2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS ca2.epicbrowser.net:8888;DIRECT;';\n" +
                "   return 'HTTPS ca2.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_ca2ndServer_epicbrowser_com);
        //alert('connected to canada');
    },
    // ***** Canada Servers ***** <<<
    // ***** Spain Servers ***** >>>
    connect_spain: function (){
         var config_es_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS es.epicbrowser.com:44300;DIRECT;';\n" +
                 "return 'HTTPS es.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_es_epicbrowser_com);
       // alert('connected to france');
    },
    connect_spain2ndServer: function (){
         var config_es2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS es2.epicbrowser.com:44300;DIRECT;';\n" +
                "   return 'HTTPS es2.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_es2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** Spain Servers ***** <<<
    // ***** Netherlands Servers ***** >>>
    connect_netherlands: function (){
         var config_nl_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS ne.epicbrowser.net:8888;DIRECT;';\n" +
                 "return 'HTTPS ne.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_nl_epicbrowser_com);
       // alert('connected to france');
    },
    connect_netherlands2ndServer: function (){
         var config_nl2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS ne2.epicbrowser.net:8888;DIRECT;';\n" +
                "   return 'HTTPS ne2.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_nl2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** Netherlands Servers ***** <<<
    // ***** INDIA Servers ***** >>>
    connect_india: function (){
         var config_in_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS in.epicbrowser.net:8888;DIRECT;';\n" +
                 "return 'HTTPS in.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_in_epicbrowser_com);
       // alert('connected to france');
    },
    connect_india2ndServer: function (){
         var config_in2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS in2.epicbrowser.net:8888;DIRECT;';\n" +
                "   return 'HTTPS in2.epicbrowser.net:8888;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_in2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** INDIA Servers ***** <<<
    // ***** Ireland Servers ***** >>>
    connect_ireland: function (){
         var config_ie_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS ie.epicbrowser.com:44300;DIRECT;';\n" +
                 "return 'HTTPS ie.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_ie_epicbrowser_com);
       // alert('connected to france');
    },
    connect_ireland2ndServer: function (){
         var config_ie2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS ie2.epicbrowser.com:44300;DIRECT;';\n" +
                "   return 'HTTPS ie2.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_ie2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** Ireland Servers ***** <<<
    // ***** Lithuania Servers ***** >>>
    connect_lithuania: function (){
         var config_li_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS li.epicbrowser.com:44300;DIRECT;';\n" +
                 "return 'HTTPS li.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_li_epicbrowser_com);
       // alert('connected to france');
    },
    connect_lithuania2ndServer: function (){
         var config_li2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS li2.epicbrowser.com:44300;DIRECT;';\n" +
                "   return 'HTTPS li2.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_li2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** Lithuania Servers ***** <<<
    // ***** Belgium Servers ***** >>>
    connect_belgium: function (){
         var config_be_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS be.epicbrowser.com:44300;DIRECT;';\n" +
                 "return 'HTTPS be.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_be_epicbrowser_com);
        //alert('connected to belgium');
    },
    connect_belgium2ndServer: function (){
         var config_be2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS be2.epicbrowser.com:44300;DIRECT;';\n" +
                "   return 'HTTPS be2.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };

        proxy.proxySettings(config_be2ndServer_epicbrowser_com);
        //alert('connected to belgium');
    },
    // ***** Belgium Servers ***** <<<
    // ***** Finland Servers ***** >>>
    connect_finland: function (){
         var config_fi_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS fi.epicbrowser.com:44300;DIRECT;';\n" +
                 "return 'HTTPS fi.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };
        proxy.proxySettings(config_fi_epicbrowser_com);
       // alert('connected to france');
    },
    connect_finland2ndServer: function (){
         var config_fi2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS fi2.epicbrowser.com:44300;DIRECT;';\n" +
                "   return 'HTTPS fi2.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };
        proxy.proxySettings(config_fi2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** Finland Servers ***** <<<
    // ***** Czech republic Servers ***** >>>
    connect_czech_republic: function (){
         var config_cz_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS cz.epicbrowser.com:44300;DIRECT;';\n" +
                 "return 'HTTPS cz.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };
        proxy.proxySettings(config_cz_epicbrowser_com);
       // alert('connected to france');
    },
    connect_czech_republic2ndServer: function (){
         var config_cz2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS cz2.epicbrowser.com:44300;DIRECT;';\n" +
                "   return 'HTTPS cz2.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };
        proxy.proxySettings(config_cz2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** Czech republic Servers ***** <<<
    // ***** Poland Servers ***** >>>
    connect_poland: function (){
         var config_po_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS po.epicbrowser.com:44300;DIRECT;';\n" +
                 "return 'HTTPS po.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };
        proxy.proxySettings(config_po_epicbrowser_com);
       // alert('connected to france');
    },
    connect_poland2ndServer: function (){
         var config_po2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS po2.epicbrowser.com:44300;DIRECT;';\n" +
                "   return 'HTTPS po2.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };
        proxy.proxySettings(config_po2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** Poland Servers ***** <<<
    // ***** Portugal Servers ***** >>>
    connect_portugal: function (){
         var config_pt_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS pt.epicbrowser.com:44300;DIRECT;';\n" +
                 "return 'HTTPS pt.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };
        proxy.proxySettings(config_pt_epicbrowser_com);
       // alert('connected to france');
    },
    connect_portugal2ndServer: function (){
         var config_pt2ndServer_epicbrowser_com = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS pt2.epicbrowser.com:44300;DIRECT;';\n" +
                "   return 'HTTPS pt2.epicbrowser.com:44300;';\n" +
 
                "}"
            }
        };
        proxy.proxySettings(config_pt2ndServer_epicbrowser_com);
       // alert('connected to france');
    },
    // ***** Portugal Servers ***** <<<

    connectThruProxy: function () {
        var config_faisla_in = {
             mode: "pac_script",
            pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
 
                "if(host=='duckduckgo.com' || host=='www.google.com' || host=='www.google.co.in' || host=='blekko.com' || host=='encrypted.google.com' || host=='www.bing.com'|| host=='live.com' || host=='infospace.com' || host=='www.google.co.uk' ||  host=='ixquick.com' || host=='dogpile.com' || host=='inspcloud.com' || host=='yandex.com' ||host=='yandex.ru' || host=='yandex.rt' || host=='naver.com' || host=='naver.net' || host=='nate.com'|| host=='baidu.com'|| host=='ask.com'|| host=='sogou.com'||host=='soso.com'|| host=='so.com'||host=='sezname.cz' || host=='vinden.nl' || host=='onet.pl') \n" +
                     "return 'HTTPS www.faisla.in:44300;';\n" +
                    "else if(host == 'www.epicsearch.in' || host == '*.search.yahoo.com' || host == 'search.yahoo.com') \n" +
                      "  return 'HTTPS www.faisla.in:44300; DIRECT;';\n" +
                "else return DIRECT\n" +
                    "}"
            }
        };
 
      
        var config_epicbrowser_net = {
             mode: "pac_script",
            pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
 
                "if(host=='duckduckgo.com' || host=='www.google.com' || host=='www.google.co.in' || host=='blekko.com' || host=='encrypted.google.com' || host=='www.bing.com'|| host=='live.com' || host=='infospace.com' || host=='www.google.co.uk' ||  host=='ixquick.com' || host=='dogpile.com' || host=='inspcloud.com' || host=='yandex.com' ||host=='yandex.ru' || host=='yandex.rt' || host=='naver.com' || host=='naver.net' || host=='nate.com'|| host=='baidu.com'|| host=='ask.com'|| host=='sogou.com'||host=='soso.com'|| host=='so.com'||host=='sezname.cz' || host=='vinden.nl' || host=='onet.pl') \n" +
                     "return 'HTTPS epicbrowser.net:44300;';\n" +
                    "else if(host == 'www.epicsearch.in' || host == '*.search.yahoo.com' || host == 'search.yahoo.com') \n" +
                      "  return 'HTTPS epicbrowser.net:44300; DIRECT;';\n" +
                "else return DIRECT\n" +
                    "}"
            }
        };
 
       var config_odecide_com = {
             mode: "pac_script",
            pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +

                "if(host=='duckduckgo.com' || host=='www.google.com' || host=='www.google.co.in' || host=='blekko.com' || host=='encrypted.google.com' || host=='www.bing.com'|| host=='live.com' || host=='infospace.com' || host=='www.google.co.uk' ||  host=='ixquick.com' || host=='dogpile.com' || host=='inspcloud.com' || host=='yandex.com' ||host=='yandex.ru' || host=='yandex.rt' || host=='naver.com' || host=='naver.net' || host=='nate.com'|| host=='baidu.com'|| host=='ask.com'|| host=='sogou.com'||host=='soso.com'|| host=='so.com'||host=='sezname.cz' || host=='vinden.nl' || host=='onet.pl') \n" +
                     "return 'HTTPS www.odecide.com:44300;';\n" +
                    "else if(host == 'www.epicsearch.in' || host == '*.search.yahoo.com' || host == 'search.yahoo.com') \n" +
                      "  return 'HTTPS www.odecide.com:44300; DIRECT;';\n" +
                "else return DIRECT\n" +
                    "}"
            }
        };



 console.log(rand)
        if(rand <=35){

            //proxy.proxySettings(config_epicbrowser_net);
             proxy.proxySettings(config_faisla_in);

         }else if(rand>35 && rand <=70){
               proxy.proxySettings(config_odecide_com);
         }else {
           proxy.proxySettings(config_epicbrowser_net);
           //proxy.proxySettings(config_odecide_com);

        }

    },

    connect_global: function () {

        var config_global_faisla_in = {
            mode: "pac_script",
            pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                    "return 'HTTPS www.faisla.in:44300;DIRECT;';\n" +
                 "return 'HTTPS www.faisla.in:44300;';\n" +
 
                "}"
            }
        };
 
       
 
 
        var config_global_epicbrowser_net = {
             mode: "pac_script",
             pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS epicbrowser.net:44300;DIRECT;';\n" +
                 "return 'HTTPS epicbrowser.net:44300;';\n" +
 
                "}"
            }
        };
 
        var config_global_odecide_com = {
            mode: "pac_script",
            pacScript: {
                data: "function FindProxyForURL(url, host) {\n" +
                 "if(host == '*.search.yahoo.com' || host == 'search.yahoo.com' || host == 'ys.epicbrowser.com' || host == 'searchyahoo.epicbrowser.com') \n" +
                      "return 'DIRECT;';\n" +
                 "else if(host == 'www.epicsearch.in') \n" +
                      "return 'HTTPS www.odecide.com:44300;DIRECT;';\n" +
                 "return 'HTTPS www.odecide.com:44300;';\n" +
 
                "}"
            }
        };
console.log(rand)
      if(rand <=35){
   
            //proxy.proxySettings(config_epicbrowser_net);
             proxy.proxySettings(config_global_faisla_in);
 
         }else if(rand>35 && rand <=70){
               proxy.proxySettings(config_global_odecide_com);
         }else {
           proxy.proxySettings(config_global_epicbrowser_net);
          // alert('connected config_global_epicbrowser_net');
           //proxy.proxySettings(config_odecide_com);
 
        }

         //config_global_epicbrowser_net 
        //proxy.proxySettings(config_global_odecide_com);
        //proxy.proxySettings(config_global_faisla_in); 

    },
 
    connectDirectly: function () {
        //alert('commect directly')
        proxy.proxySettings({
            mode: "direct"
        });
    }
};
 
var requestFilter = {
    urls: ["<all_urls>"]
};

setProxy = function (details) {
    // var obj = {};
    // obj.tabId = details.tabId;
    // obj.url = proxy_utils.get_stripped_url(details.url)
    // obj.enabled = false;

    // if (localStorage.getItem('proxyMode') == "on") {            // ***** Chrome.storage changes *****
    if (getItem('proxyMode') == "on") {
       // alert('THIS CODE IS NOT');
        proxy.connect_global();
        }

    // else if (proxy.checkAndEnableProxy(obj)) {
    //     proxy.connectThruProxy();
    // } else
    //     proxy.connectDirectly();



    if(obj.url.indexOf('netflix.com')!=-1){

             return{redirectUrl : details.url.replace('netflix.com/', 'updates.epicbrowser.com/extensions/win/netflix.html')};

    }

  return {};
};

/* function connect_to_country(countryId){
    switch(countryId){
        case 'eastUSAProxy':
            proxy.connect_use();
            break;
        case 'westUSAProxy':
            proxy.connect_usw();
            break;
        case  'lyonFranceProxy':
            proxy.connect_france();
            break;
        case 'deProxy':
            proxy.connect_germany();
            break;
        case 'singapore':
            proxy.connect_singapore();
            break;
        case 'itProxy':
            proxy.connect_italy();
            break;
        case 'uk':
            proxy.connect_uk();
            break; 
        case 'SpainProxy':
            proxy.connect_spain();
            break;
        case 'CanadaProxy':
            proxy.connect_canada();
            break;
        case 'NetherlandsProxy':
            proxy.connect_netherlands();
            break;
        case 'IndiaProxy':
            proxy.connect_india();
            break;
        case 'IrelandProxy':
            proxy.connect_ireland();
            break;
        case 'LithuaniaProxy':
            proxy.connect_lithuania();
            break;
        case 'BelgiumProxy':
            proxy.connect_belgium();
            break;
        case 'FinlandProxy':
            proxy.connect_finland();
            break;
        case 'CzechRepublicProxy':
            proxy.connect_czech_republic();
            break;
        case 'PolandProxy':
            proxy.connect_poland();
            break;        
        case 'PortugalProxy':
            proxy.connect_portugal();
            break;        
        default:        
        //proxy.connect_global();
        //alert('country not set yet');
    }
}
*/

// 
function getRandomInt (min, max) {
     return Math.floor(Math.random() * (max - min + 1)) + min;
}
 
var rand = getRandomInt(0, 100);
// *******************************************

function connect_to_country(countryId){
    switch(countryId){
        case 'eastUSAProxy':
            //proxy.connect_use();
            // if(rand <= 34){
            //     proxy.connect_use();
            //     // alert(use1st server);
            // } else if(rand > 34 && rand <= 67){                    // if(rand > 34 && rand < 67{
            //     proxy.connect_use2ndServer();
            //     // alert(use2nd server);
            // } else {                                  // if(rand > 67 && rand <= 100){
            //     proxy.connect_use3rdServer();
            //     // alert(use2nd server);
            // }
            if(rand <= 25){
                proxy.connect_use();
                // alert(use1st server);
            } else if(rand > 25 && rand <= 50){                    // if(rand > 25 && rand <= 50{
                proxy.connect_use2ndServer();
                // alert(use2nd server);
            } else if(rand > 50 && rand <= 75){                    // if(rand > 50 && rand <= 75{
                proxy.connect_use3rdServer();
                // alert(use3rd server);
            } else {                                  // if(rand > 75 && rand <= 100){
                proxy.connect_use4thServer();
                // alert(use4th server);
            }
            break;
        case 'westUSAProxy':
            if(rand <=50){
                proxy.connect_usw();
            } else {
                proxy.connect_usw2ndServer();
            }
            break;
        case  'lyonFranceProxy':
            // Got some issue with this server, couldn't able to login, so we are distributing the traffic of frace in between
            // 50% traffic to the fr.epicbrowser.net and 50% to the fr2.epicbrowser.net
            // if(rand <= 34){
            //     proxy.connect_france();
            // } else if(rand > 34 && rand <= 67){ 
            //     proxy.connect_france2ndServer();
            // } else {
            //     proxy.connect_france3rdServer();
            //     // alert(france3rdServer);
            // }
            if(rand <=50){
                proxy.connect_france2ndServer();
            } else {
                proxy.connect_france3rdServer();
            }
            // **********************
            break;
        case 'deProxy':
            if(rand <=50){
                proxy.connect_germany();
            } else {
                proxy.connect_germany2ndServer();
            }
            break;
        case 'singapore':
            if(rand <=50){
                proxy.connect_singapore();
            } else {
                proxy.connect_singapore2ndServer();
            }
            break;
        case 'itProxy':
            if(rand <=50){
                proxy.connect_italy();
            } else {
                proxy.connect_italy2ndServer();
            }
            break;
        case 'uk':
            if(rand <=50){
                proxy.connect_uk();
            } else {
                proxy.connect_uk2ndServer();
            }
            break; 
        case 'SpainProxy':
            if(rand <=50){
                proxy.connect_spain();
            } else {
                proxy.connect_spain2ndServer();
            }
            break;
        case 'CanadaProxy':
            if(rand <=50){
                proxy.connect_canada();
            } else {
                proxy.connect_canada2ndServer();
            }
            break;
        case 'NetherlandsProxy':
            if(rand <=50){
                proxy.connect_netherlands();
            } else {
                proxy.connect_netherlands2ndServer();
            }
            break;
        case 'IndiaProxy':
            if(rand <=50){
                proxy.connect_india();
            } else {
                proxy.connect_india2ndServer();
            }
            break;
        case 'IrelandProxy':
            if(rand <=50){
                proxy.connect_ireland();
            } else {
                proxy.connect_ireland2ndServer();
            }
            break;
        case 'LithuaniaProxy':
            if(rand <=50){
                proxy.connect_lithuania();
            } else {
                proxy.connect_lithuania2ndServer();
            }
            break;
        case 'BelgiumProxy':
            if(rand <=50){
                proxy.connect_belgium();
            } else {
                proxy.connect_belgium2ndServer();
            }
            break;
        case 'FinlandProxy':
            if(rand <=50){
                proxy.connect_finland();
            } else {
                proxy.connect_finland2ndServer();
            }
            break;
        case 'CzechRepublicProxy':
            if(rand <=50){
                proxy.connect_czech_republic();
            } else {
                proxy.connect_czech_republic2ndServer();
            }
            break;
        case 'PolandProxy':
            if(rand <=50){
                proxy.connect_poland();
            } else {
                proxy.connect_poland2ndServer();
            }
            break;        
        case 'PortugalProxy':
            if(rand <=50){
                proxy.connect_portugal();
            } else {
                proxy.connect_portugal2ndServer();
            }
            break;        
        default:        
        //proxy.connect_global();
        //alert('country not set yet');
    }
}

function stopTheProxy(){
  console.log('stop proxy called')
  // localStorage.setItem('proxyMode', 'off');    // Converted from Local storage to chrome.storage
  setItem('proxyMode', 'off');
  // if (localStorage.getItem('proxyMode') == "off") {    // Converted from Local storage to chrome.storage
  if (getItem('proxyMode') == "off") {
      proxy.connectDirectly();
  }
}

function startTheProxy(){
  console.log('start proxy called')
  // localStorage.setItem('proxyMode', 'on');     // Converted from Local storage to chrome.storage
  // if(localStorage.getItem('countryId')=='noCountrySet'){
  setItem('proxyMode', 'on');
  if(getItem('countryId')=='noCountrySet'){
      //alert(countryId);
      countryId='eastUSAProxy';
      setItem('countryId', countryId );        
  }
  else{
      countryId=getItem('countryId');
  }
  connect_to_country(countryId);
}
///ADDED BY YOUSSEF



// });
/////COPIED FROM TOGGLE.JS


function updateIcons() {
  if (getItem('proxyMode') == "on"){
    chrome.browserAction.setIcon({path : "images/ic24_on.png" });
  } else {
    chrome.browserAction.setIcon({path : "images/ic24_off.png" });
  }
}

function pageLoaded(){
  updateIcons();
}

initStorage();       // Converted from Local storage to chrome.storage
