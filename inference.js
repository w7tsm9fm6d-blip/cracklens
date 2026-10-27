/* Browser inference using the original CrackLens weights. */
(function(root){
'use strict';
const f=Math.fround;
function coefficients(source,target){
 const scale=source/target, support=Math.max(scale,1), out=[];
 for(let i=0;i<target;i++){
  const center=(i+.5)*scale, start=Math.max(0,Math.floor(center-support+.5)), end=Math.min(source,Math.floor(center+support+.5));
  const weights=[];let sum=0;
  for(let p=start;p<end;p++){const w=Math.max(0,1-Math.abs((p+.5-center)/support));weights.push(w);sum+=w;}
  out.push({start,weights:weights.map(w=>Math.floor(w/sum*4194304+.5))});
 }return out;
}
function resizeGray(gray,width,height){
 const n=64,cx=coefficients(width,n),cy=coefficients(height,n),temp=new Uint8Array(n*height),out=new Uint8Array(n*n);
 for(let y=0;y<height;y++)for(let x=0;x<n;x++){
  const c=cx[x];let sum=2097152;for(let k=0;k<c.weights.length;k++)sum+=gray[y*width+c.start+k]*c.weights[k];temp[y*n+x]=Math.max(0,Math.min(255,Math.floor(sum/4194304)));
 }
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const c=cy[y];let sum=2097152;for(let k=0;k<c.weights.length;k++)sum+=temp[(c.start+k)*n+x]*c.weights[k];out[y*n+x]=Math.max(0,Math.min(255,Math.floor(sum/4194304)));
 }return out;
}
function fromRGBA(rgba,width,height){
 const gray=new Uint8Array(width*height);
 for(let i=0;i<gray.length;i++)gray[i]=(rgba[i*4]*19595+rgba[i*4+1]*38470+rgba[i*4+2]*7471+32768)>>16;
 return resizeGray(gray,width,height);
}
function features(gray){
 const n=64,a=Float32Array.from(gray,v=>f(v/255)),mag=new Float32Array(4096),angle=new Float32Array(4096);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=y*n+x;
  const gx=x===0?f(a[i+1]-a[i]):x===n-1?f(a[i]-a[i-1]):f(f(a[i+1]-a[i-1])/2);
  const gy=y===0?f(a[i+n]-a[i]):y===n-1?f(a[i]-a[i-n]):f(f(a[i+n]-a[i-n])/2);
  mag[i]=Math.hypot(gx,gy);let theta=f(Math.atan2(gy,gx));theta=theta<0?f(theta+f(Math.PI)):theta;angle[i]=theta>=f(Math.PI)?0:theta;
 }
 const result=[];
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){
  const hist=new Float32Array(8);
  for(let y=row*16;y<(row+1)*16;y++)for(let x=col*16;x<(col+1)*16;x++){
   const i=y*n+x;let bin=0;while(bin<7&&angle[i]>=f((bin+1)*f(Math.PI)/8))bin++;hist[bin]=f(hist[bin]+mag[i]);
  }
  const sum=hist.reduce((a,b)=>a+b,0)+1e-7;for(const v of hist)result.push(v/sum);
 }
 const hist=new Array(16).fill(0);let mean=0,edgeMean=0,dark=0,edgeCount=0;
 for(let i=0;i<a.length;i++){hist[Math.min(15,Math.floor(a[i]*16))]++;mean+=a[i];edgeMean+=mag[i];if(a[i]<.25)dark++;if(mag[i]>.12)edgeCount++;}
 result.push(...hist.map(v=>v/a.length*16));mean/=a.length;edgeMean/=a.length;
 let variance=0,edgeVariance=0;for(let i=0;i<a.length;i++){variance+=(a[i]-mean)**2;edgeVariance+=(mag[i]-edgeMean)**2;}
 const sorted=Array.from(a).sort((a,b)=>a-b),quantile=p=>{const at=p*(sorted.length-1),lower=Math.floor(at);return sorted[lower]+(sorted[Math.ceil(at)]-sorted[lower])*(at-lower);};
 result.push(mean,Math.sqrt(variance/a.length),quantile(.1),quantile(.9),edgeMean,Math.sqrt(edgeVariance/a.length),dark/a.length,edgeCount/a.length);
 for(const values of [a,mag])for(let row=0;row<16;row++)for(let col=0;col<16;col++){
  let sum=0;for(let dy=0;dy<4;dy++)for(let dx=0;dx<4;dx++)sum+=values[(row*4+dy)*64+col*4+dx];result.push(sum/16);
 }
 return Float32Array.from(result);
}
function predict(feature,model){
 if(feature.length!==model.feature_mean.length)throw new Error('Dimensión del modelo incompatible.');
 const x=Float32Array.from(feature,(v,i)=>f(f(v-model.feature_mean[i])/model.feature_std[i]));
 let logit=model.b2[0];
 for(let j=0;j<model.b1.length;j++){let h=model.b1[j];for(let i=0;i<x.length;i++)h+=x[i]*model.W1[i][j];logit+=Math.max(0,h)*model.W2[j];}
 return 1/(1+Math.exp(-Math.max(-40,Math.min(40,logit))));
}
const api={resizeGray,fromRGBA,features,predict};root.CrackLens=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
