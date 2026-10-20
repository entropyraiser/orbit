// Shared fake data + helpers for the static design samples.
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function series(seed,n,drift){const r=rng(seed);let v=100;const o=[];for(let i=0;i<n;i++){v+= (r()-.5)*3+drift;o.push(v)}return o}
function path(s,w,h,pad=6){const mn=Math.min(...s),mx=Math.max(...s);return s.map((v,i)=>`${i?'L':'M'}${(i/(s.length-1)*w).toFixed(1)},${(h-pad-(v-mn)/(mx-mn||1)*(h-pad*2)).toFixed(1)}`).join('')}
const WATCH=[
 {sym:'AAPL',name:'Apple Inc.',price:342.94,pct:-0.15,seed:3,d:-.02},
 {sym:'NVDA',name:'NVIDIA Corporation',price:217.09,pct:1.38,seed:8,d:.08},
 {sym:'MSFT',name:'Microsoft Corporation',price:533.52,pct:0.84,seed:12,d:.05},
 {sym:'TSM',name:'Taiwan Semiconductor',price:420.22,pct:1.84,seed:21,d:.1},
 {sym:'ASML',name:'ASML Holding N.V.',price:1647.12,pct:0.34,seed:5,d:.03},
 {sym:'7203.T',name:'Toyota Motor Corp',price:3102.00,pct:-0.62,seed:30,d:-.05},
 {sym:'005930.KS',name:'Samsung Electronics',price:211500,pct:-2.98,seed:33,d:-.15},
 {sym:'0700.HK',name:'Tencent Holdings',price:410.40,pct:-1.77,seed:41,d:-.1},
 {sym:'RELIANCE.NS',name:'Reliance Industries',price:1202.00,pct:-0.76,seed:44,d:-.04},
];
const INDEX=[['S&P 500','7,690.73',0.41],['Nasdaq','26,430.89',1.11],['FTSE 100','10,702.16',-0.58],['DAX','25,117.98',-0.80],['Nikkei 225','64,075.42',-1.30],['Hang Seng','23,867.74',-1.32],['Nifty 50','22,888.95',-1.11]];
const fmt=n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const sgn=p=>(p>0?'+':p<0?'−':'')+Math.abs(p).toFixed(2)+'%';
const FLAG={'AAPL':'🇺🇸','NVDA':'🇺🇸','MSFT':'🇺🇸','TSM':'🇹🇼','ASML':'🇳🇱','7203.T':'🇯🇵','005930.KS':'🇰🇷','0700.HK':'🇭🇰','RELIANCE.NS':'🇮🇳'};
const IFLAG=['🇺🇸','🇺🇸','🇬🇧','🇩🇪','🇯🇵','🇭🇰','🇮🇳'];
