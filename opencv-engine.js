/* CrackLens: forward pass of the original trained network using OpenCV.js. */
(function(root){
'use strict';
function createOpenCVEngine(library,model){
 // Older Emscripten builds return a self-resolving thenable. Wrap the module
 // before resolving our Promise to avoid recursive Promise assimilation.
 const ready=new Promise((resolve,reject)=>{
  const done=instance=>resolve({instance});
  if(library&&typeof library.Mat==='function')done(library);
  else if(library&&typeof library.then==='function')library.then(done,reject);
  else if(library){library.onRuntimeInitialized=()=>done(library);library.onAbort=()=>reject(new Error('OpenCV no pudo iniciarse.'));}
  else reject(new Error('No se encontró la biblioteca OpenCV.'));
 });
 return ready.then(({instance:cv})=>{
  const inputSize=model.feature_mean.length,hiddenSize=model.b1.length;
  const w1=cv.matFromArray(inputSize,hiddenSize,cv.CV_32F,model.W1.flat());
  const b1=cv.matFromArray(1,hiddenSize,cv.CV_32F,model.b1);
  const w2=cv.matFromArray(hiddenSize,1,cv.CV_32F,model.W2);
  const b2=cv.matFromArray(1,1,cv.CV_32F,model.b2);
  return {
   name:'OpenCV.js 4.13.0',
   predict(feature){
    if(feature.length!==inputSize)throw new Error('Características incompatibles con el modelo.');
    const normalized=Float32Array.from(feature,(value,i)=>Math.fround(Math.fround(value-model.feature_mean[i])/model.feature_std[i]));
    const input=cv.matFromArray(1,inputSize,cv.CV_32F,normalized),hidden=new cv.Mat(),output=new cv.Mat();
    try{
     cv.gemm(input,w1,1,b1,1,hidden);
     cv.threshold(hidden,hidden,0,0,cv.THRESH_TOZERO);
     cv.gemm(hidden,w2,1,b2,1,output);
     const logit=Math.max(-40,Math.min(40,output.data32F[0]));
     return 1/(1+Math.exp(-logit));
    }finally{input.delete();hidden.delete();output.delete();}
   },
   dispose(){w1.delete();b1.delete();w2.delete();b2.delete();}
  };
 });
}
root.createOpenCVEngine=createOpenCVEngine;
if(typeof module!=='undefined'&&module.exports)module.exports=createOpenCVEngine;
else root.CRACKLENS_ENGINE=createOpenCVEngine(root.cv,root.CRACKLENS_MODEL);
})(typeof globalThis!=='undefined'?globalThis:this);
