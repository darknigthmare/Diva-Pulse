/* Read actual GPU transform feedback, without relying on screenshots for numeric proof. */
()=>{
 const g=PulseApp.stage.gl,sha=(t,s)=>{const x=g.createShader(t);g.shaderSource(x,s);g.compileShader(x);if(!g.getShaderParameter(x,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(x));return x;};
 const vs=sha(g.VERTEX_SHADER,`#version 300 es
 precision highp float;
 layout(location=0) in vec3 position;layout(location=1) in vec3 normal;layout(location=3) in vec4 joints;layout(location=4) in vec4 weights;
 layout(location=5) in float skinType;layout(location=6) in vec3 sdefC;layout(location=7) in vec3 sdefR0;layout(location=8) in vec3 sdefR1;
 uniform mat4 bones[4];mat4 bone(int i){return bones[i];}
 ${PulseSkinning.glsl}
 out vec3 tfP;out vec3 tfN;void main(){tfP=position;tfN=normal;advancedSkin(tfP,tfN);gl_Position=vec4(tfP,1.0);gl_PointSize=1.0;}`),fs=sha(g.FRAGMENT_SHADER,'#version 300 es\nprecision highp float;out vec4 c;void main(){c=vec4(1.0);}'),pr=g.createProgram();
 g.attachShader(pr,vs);g.attachShader(pr,fs);g.transformFeedbackVaryings(pr,['tfP','tfN'],g.INTERLEAVED_ATTRIBS);g.linkProgram(pr);if(!g.getProgramParameter(pr,g.LINK_STATUS))throw Error(g.getProgramInfoLog(pr));
 const vao=g.createVertexArray(),tf=g.createTransformFeedback(),buf=g.createBuffer();g.bindVertexArray(vao);g.bindTransformFeedback(g.TRANSFORM_FEEDBACK,tf);g.bindBuffer(g.TRANSFORM_FEEDBACK_BUFFER,buf);g.bufferData(g.TRANSFORM_FEEDBACK_BUFFER,24,g.STREAM_READ);g.bindBufferBase(g.TRANSFORM_FEEDBACK_BUFFER,0,buf);g.useProgram(pr);g.enable(g.RASTERIZER_DISCARD);
 const results=[],I=Array.from(PulseStage.math.I());
 for(const type of [0,3,4])for(let j=0;j<12;j++){
  const mats=[0,1,2,3].map((n)=>Array.from(PulseStage.math.trs([n*.3,j*.03,-n*.2],PulseStage.math.quatEuler(n*.2,(n-1)*.7,(j-5)*.12),[1,1,1]))),w=type===3?[.35,.65,0,0]:[.1,.2,.3,.4],p=[.8,1.2,-.3],norm=[.6,.8,0],c=[.2,.4,.1],r0=[-.4,.1,.2],r1=[.5,-.2,.1];
  g.vertexAttrib3fv(0,p);g.vertexAttrib3fv(1,norm);g.vertexAttrib4fv(3,[0,1,2,3]);g.vertexAttrib4fv(4,w);g.vertexAttrib1f(5,type);g.vertexAttrib3fv(6,c);g.vertexAttrib3fv(7,r0);g.vertexAttrib3fv(8,r1);
  g.uniformMatrix4fv(g.getUniformLocation(pr,'bones[0]'),false,new Float32Array(mats.flat()));g.beginTransformFeedback(g.POINTS);g.drawArrays(g.POINTS,0,1);g.endTransformFeedback();const out=new Float32Array(6);g.getBufferSubData(g.TRANSFORM_FEEDBACK_BUFFER,0,out);
  const expected=PulseSkinning.deform({position:p,normal:norm,type,matrices:mats,weights:w,c,r0,r1}),delta=Math.max(...[...expected.position,...expected.normal].map((x,i)=>Math.abs(x-out[i])));results.push({type,case:j,maxError:delta});
 }
 g.disable(g.RASTERIZER_DISCARD);g.bindBufferBase(g.TRANSFORM_FEEDBACK_BUFFER,0,null);g.bindTransformFeedback(g.TRANSFORM_FEEDBACK,null);g.bindVertexArray(null);g.deleteTransformFeedback(tf);g.deleteBuffer(buf);g.deleteVertexArray(vao);g.deleteProgram(pr);g.deleteShader(vs);g.deleteShader(fs);return {results,maxError:Math.max(...results.map(r=>r.maxError)),glError:g.getError()};
}
