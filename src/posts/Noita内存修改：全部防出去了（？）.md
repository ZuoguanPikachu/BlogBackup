---
title: Noita内存修改：全部防出去了（？）
date: 2025-01-30 13:02:25
tags: 内存修改
categories: 编程
index_img: https://zuoguan-piclib-1257172707.cos.ap-guangzhou.myqcloud.com/assets/18.jpg?imageMogr2/thumbnail/700x320>
banner_img: https://zuoguan-piclib-1257172707.cos.ap-guangzhou.myqcloud.com/assets/18.jpg
---

因为对上一个版本的解决方案并不满意，在重构完代码后，我又继续对Noita进行分析。

首先，打了一个能生成任意物品的MOD，用于生成变形魔药，方便我进行分析。对血量下面1、2级地址进行查找访问、写入，筛选出了如下代码片段：

```assembly
noita.exe+4E4173: 89 0C 98              - mov [eax+ebx*4],ecx
```

这行代码，个人推测是和新生成物品相关的。而变形成怪物与变回人，也是通过new一个对象完成的，此时`ebx*4`就是offset。

```assembly
noita.exe+4E43F2: C7 04 90 00 00 00 00  - mov [eax+edx*4],00000000
```

这行代码，应该是与变形后，删除原对象相关的。

我很希望能在第1个代码片段附近，找到能判断是否是因玩家被变形而执行这段代码的标志。可惜，未果。

那就只能结合以上两个片段了。基本思路就是，在第1个代码片段处，将`ebx`写入到内存中。在第2个代码片段处，判断被删除的对象是不是玩家，如果是，那就从将前边写入的`ebx`写入到另一块内存中。锁血脚本则读取后一块内存中的值来计算偏移。

这种解决方法，是假设了被变形后，第1个代码片段只执行一次，然后就执行第2个代码片段。但是变形回人时，就不符合假设了。不过我观察到，此时1个代码片段会执行3次，第一次`ebx*4`是offset，后两次不是，而后两次`[ecx+4c]`，即可能的血量，都是1.75。那么就可以以此为为标志，如果是1.75就不写入内存。

在汇编中，是不能直接写1.75的，这需要一些技巧：

```assembly
movss xmm0,[ecx+4c]
mov eax,3FE00000 // 1.75 的 IEEE 754 单精度浮点数
movd xmm1,eax
comiss xmm0,xmm1
```

---

按照这种从内存中读取offset的方案，在重新进行新一局游戏时，需要重新注入。那么是否有不需要重新注入的方法呢？

我们已经知道了，重开一局游戏，offset一定会是0，只要能找到能判断重开一局游戏的标志就好了。

一开始的想法是，第1个代码片段是和new对象有关的，那么应该会在游戏开始时new玩家。如果`ebx`为0，且玩家原先地址的值为0，则说明重开了一局游戏。

但非常诡异的是，居然没有`ebx`为0的时刻。且玩家原先地址的值不一定为0。

又是一番查找，找到了这个代码片段：

```assembly
noita.exe+4C84AE: C7 46 40 00 00 00 00  - mov [esi+40],00000000
```

`[esi+40]`相当于上两个代码片段中的`eax`，所以，dddd。执行这行代码，意味着重新开了一局游戏。

---

完整解决方案：

1. 获取初始offset

   ```assembly
   mov eax,[ebp+08]
   mov [offset],eax
   ```

2. 变形时，更新offset

   ```assembly
   mov [eax+ebx*4],ecx
   movss xmm0,[ecx+4c]
   mov eax,3FE00000
   movd xmm1,eax
   comiss xmm0,xmm1
   je return
   mov [tmpoffset],ebx
   jmp return
   ```

   ```assembly
   mov [eax+edx*4],00000000
   mov edx,[offset]
   mov eax,[noita.exe+e04b98]
   mov eax,[eax+2c]
   mov eax,[eax+7c]
   mov eax,[eax+40]
   mov eax,[eax+edx*4]
   test eax,eax
   jne return
   mov edx,[tmpoffset]
   mov [offset],edx
   jmp return
   ```

3. 重开一局游戏时，更新offset

   ```assembly
   mov [esi+40],00000000
   mov [offset],00000000
   ```

现在，只需要在刚开始游戏时，注入一次，就能实现全程锁血了。
