
## 未超时

```
spts=1000*[100%+(L-1)*10%]*(100%+25%*RP)*[75%+25%*(TL-T)/TL]
```
```
RP=1-(R-1)/C
奖励分 bpts=pts*{10%*[1/(TY-STY+1)]}
pts=spts+bpts
```

|参数|备注|
|---|---|
|pts|得分|
|bpts|奖励分|
|spts|基本得分|
|L|难度系数（1-10）|
|R|结算排名|
|C|参与总人数|
|RP|领先与其他玩家百分比|
|T|用时（单位小时,最大值为TL, 比赛开始到当前时间[进行中]/完赛时间[结束]）|
|TL|比赛限时|
|TY|实际提交次数（此奖励分仅限第一名获取）|
|STY|预设提交次数|

最低得分：750

最高得分（难度1）：1375

最高得分（难度10）：2612.5

## 超时
```
pts=10*25%*[100%+(L-1)*10%]*100
```

|参数|备注|
|---|---|
|pts|得分|
|L|难度系数（1-10）|

最高得分：475

最低得分：250

## 其他
得分计算保留两位小数