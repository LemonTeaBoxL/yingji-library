(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YingjiGallery=api})(globalThis,function(){
  'use strict';
  // Equal-height rows preserve each source ratio. The last row never enlarges to fill the page.
  function layout(ratios,width,target=160,gap=12){
    width=Math.max(1,Number(width)||1);target=Math.min(Math.max(80,Number(target)||160),width);
    const values=ratios.map(r=>Number.isFinite(Number(r))&&Number(r)>0?Number(r):1.5),result=[];
    let start=0,row=0;
    while(start<values.length){let end=start,sum=0;
      while(end<values.length){const next=values[end],before=sum*target+Math.max(0,end-start-1)*gap,after=(sum+next)*target+(end-start)*gap;
        if(end>start&&after>width&&Math.abs(width-before)<Math.abs(after-width))break;
        sum+=next;end++;if(after>=width)break;
      }
      const n=end-start,ideal=Math.max(1,(width-gap*(n-1))/sum),height=end===values.length?Math.min(target,ideal):Math.min(target*1.28,ideal);
      for(let i=start;i<end;i++)result.push({width:values[i]*height,height,row});
      start=end;row++;
    }
    return result;
  }
  return{layout};
});
