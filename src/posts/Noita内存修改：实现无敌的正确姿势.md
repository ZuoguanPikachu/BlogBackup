---
title: Noita内存修改：实现无敌的正确姿势
date: 2025-01-16 09:29:07
tags: 内存修改
categories: 编程
index_img: https://zuoguan-piclib-1257172707.cos.ap-guangzhou.myqcloud.com/assets/16.jpg?imageMogr2/thumbnail/700x320>
banner_img: https://zuoguan-piclib-1257172707.cos.ap-guangzhou.myqcloud.com/assets/16.jpg
---

当初买Noita的时候，是它的法杖编程吸引了我。但是当我实际上手后，发现手残的我根本玩不到后期，体验不到法杖编程的乐趣。CE学有所成后，我决定对Noita下手了。

## 看不懂的汇编代码

在一开始找血量的地址遇到了一点小小的波折，Noita中血量的数据类型是`Float`，并且100血时2.25，0血时是1.75。

然后查看汇编代码时，我傻眼了

```assembly
noita.exe+6B961C: F3 0F 10 44 24 18        - movss xmm0,[esp+18]
noita.exe+6B9622: F2 0F 10 4E 48           - movsd xmm1,[esi+48]
noita.exe+6B9627: 0F 5A C0                 - cvtps2pd xmm0,xmm0
noita.exe+6B962A: F2 0F 5C C8              - subsd xmm1,xmm0
noita.exe+6B962E: F2 0F 11 4E 48           - movsd [esi+48],xmm1
noita.exe+6B9633: F2 0F 10 46 48           - movsd xmm0,[esi+48]
noita.exe+6B9638: F2 0F 10 4E 50           - movsd xmm1,[esi+50]
noita.exe+6B963D: 66 0F 2F C8              - comisd xmm1,xmm0
noita.exe+6B9641: 77 03                    - ja noita.exe+6B9646
noita.exe+6B9643: 0F 28 C1                 - movaps xmm0,xmm1
noita.exe+6B9646: 0F 57 C9                 - xorps xmm1,xmm1
noita.exe+6B9649: F2 0F 11 46 48           - movsd [esi+48],xmm0
```

好在有ChatGPT，我让它帮我猜测这些代码是做什么的。后续实验证明，它猜得很准。

`[esp+18]`是伤害量、`[esi+48]`是血量。`cvtps2pd`是将`Float`转换为`Double`。接下来2行就是血量变动了。`[esi+50]`是血量上限，血量变动后与血量上限进行比较，如果血量超过上限，就将血量设置为上限值。

既然知道血量和血量上限的地址，直接赋值不久好了。

1. ~~法1：~~`noita.exe+6B9649: movsd [esi+48],xmm0` -> `movsd [esi+48],[esi+50]`

   不可行！在 x86 和 x86-64 汇编中，`movsd` 指令的操作数规则是严格的，不允许两个操作数都直接是内存地址。它的语法只允许以下形式：

   - 从内存到寄存器：`movsd xmm, [mem]`
   - 从寄存器到内存：`movsd [mem], xmm`
   - 从寄存器到寄存器：`movsd xmm, xmm`

2. ~~法2：~~`noita.exe+6B9646: xorps xmm1,xmm1` -> `nop`；`noita.exe+6B9649: movsd [esi+48],xmm1`

   `xorps xmm1,xmm1`是将`xmm1`清零。我们不让它清零，然后赋值给`[esi+48]`。

   可惜，这也是不可行的，`xmm1`须要清零，这可能跟后续代码有关，没有细究。

3. 法3：调换顺序，先`movsd [esi+48],xmm1`，后`xorps xmm1,xmm1`

   锁血成功了。

## 杀不死的怪物、意外的死亡

其实在教学视频里例子，就是敌人、友军、玩家是共用血量变动的代码的。并且，调试过程中，玩家血量没受到伤害，却触发了断点；怪物很难杀死，都提示了我，血量变动的代码是共用的。然而，我依旧没意识到，原因是，小蜘蛛可以一下秒杀，其他一些怪，暴击的时候也可以杀死。有怪物可以被杀死，我就误以为不是Shared Code。直到我不知怎么回事，收到一条游戏信息说"你触怒了神明"，出现了圣山守卫，并且将我击杀了。

结合代码，我猜测是在`noita.exe+6B962E: movsd [esi+48],xmm1`的时候，血量小于0了，然后就死了。而之前能杀死怪，也是因为伤害超过了血量，在这一行代码时就死了。随后的实验也证明了我的猜测是对的。

## 诡计多端的偏移

处理这种情况，是需要找基址的。在这个案例中，血量的基址与偏移是这样的：

![](https://zuoguan-piclib-1257172707.cos.ap-guangzhou.myqcloud.com/Noita%E5%86%85%E5%AD%98%E4%BF%AE%E6%94%B9%EF%BC%9A%E5%AE%9E%E7%8E%B0%E6%97%A0%E6%95%8C%E7%9A%84%E6%AD%A3%E7%A1%AE%E5%A7%BF%E5%8A%BF/image-20250116110010774.png)

我们只要将`esi`与`[[[[[noita.exe+e02b78]+2c]+7c]+40]+0]`比较，如果相等，此时变动的就是玩家的血量。

然而，非常奇怪的一点，只有在游戏里选择新游戏，倒数第2个偏移才是0。在首页选择继续或者是新游戏，倒是第2个偏移是不固定的，个人推测是`0xa`到`0x6a`之间的一个数×4。

我的做法是，尝试`0xa`到`0x6a`之间的每一种可能，获取`[[[[[[noita.exe+e02b78]+2c]+7c]+40]+offset]+48]`的值，除去获取不到值的、值重复的，剩下的结果中选择第1个。这是根据我观察得来的，准确率还是比较高的，目前是百发百中。

## 唯一不变的就是变化本身

我原以为这样就能画上一个不算完美的句号了。然而，实践中发现，有的时候会突然就没有锁血了，重新进行注入后，又能继续锁血了。

一番探索后，我意识到了问题所在。我是先获得`[[[[noita.exe+e02b78]+2c]+7c]+40]+offset`，然后直接将这个值写死到注入的代码中。虽然基址与偏移是固定的，但是相对应的地址中的数值是会变的，所以直接写死的方法并不可行。

最初的想法是周期性地重新注入/周期性检测地址是否变化，变化后重新注入。但是都过于消耗性能了。

然后我想到，将获取`[[[[noita.exe+e02b78]+2c]+7c]+40]+offset`的过程也放到注入的代码中就好了。这需要一个寄存器来临时储存结果。刚好，在注入处`edx`的值是0。

```assembly
mov edx,[noita.exe+e02b78]
mov edx,[edx+2c]
mov edx,[edx+7c]
mov edx,[edx+40]
cmp esi,[edx+offset]
...
xor edx,edx
```

模块基址和offset是可以写死的。

至此，应该可以画上一个不完美的句号了吧。
