/-  c=chat
/+  mp=mop-extensions
|_  pac=pact:c
++  mope  ((mp time (unit writ:c)) lte)
++  gas
  |=  ls=(list [=time =writ:c])
  ^+  pac
  %_    pac
      wit  (gas:on:writs:c wit.pac ls)
  ::
      dex  
    %-  ~(gas by dex.pac)
    %+  turn  ls
    |=  [=time =writ:c]
    ^-  [id:c _time]
    [id.writ time]
  ==
::
++  brief
  |=  [our=ship last-read=time]
  ^-  brief:briefs:c
  =/  =time
    ?~  tim=(ram:on:writs:c wit.pac)  *time
    key.u.tim
  =/  unreads
    (lot:on:writs:c wit.pac `last-read ~)
  =/  read-id=(unit id:c)  
    (bind (pry:on:writs:c unreads) |=([key=@da val=writ:c] id.val))
  =/  count
    (lent (skim ~(tap by unreads) |=([tim=^time =writ:c] !=(author.writ our))))
  [time count read-id]
::
++  get
  |=  =id:c
  ^-  (unit [=time =writ:c])
  ?~  tim=(~(get by dex.pac) id)
    ~
  ?~  wit=(get:on:writs:c wit.pac u.tim)
    ~
  ?~  wit
    ~
  `[u.tim u.u.wit]
::
++  jab
  |=  [=id:c fun=$-(writ:c writ:c)]
  ^+  pac
  ?~  v=(get id)  pac
  =.  wit.pac  (put:on:writs:c wit.pac time.u.v (fun writ.u.v))
  pac
::
++  got
  |=  =id:c
  ^-  [=time =writ:c]
  (need (get id))
::  execute action (on host)
::
++  perform
  |=  [now=time =id:c act=action:writs:c]
  ^+  pac
  ?-  -.act
      %add
    =/  =seal:c  [id ~ ~]
    ?:  (~(has by dex.pac) id)
      pac
    |-
    ?:  (has:on:writs:c wit.pac now)  
      $(now `@da`(add now ^~((div ~s1 (bex 16)))))
    =.  wit.pac
      (put:on:writs:c wit.pac now seal p.act)
    =.  dex.pac  (~(put by dex.pac) id now)
    ?~  replying.p.act  pac
    =*  replying  u.replying.p.act
    (jab replying |=(writ:c +<(replied (~(put in replied) ^id))))
  ::
      %del
    =/  tim=(unit time)  (~(get by dex.pac) id)
    ?~  tim  pac
    =/  =time  (need tim)
    =/  wit=(unit writ:c)  (get:on:writs:c wit.pac time)
    =.  wit.pac  (put:on:writs:c wit.pac time ~)
    =.  dex.pac  (~(del by dex.pac) id)
    ?~  wit  pac
    ?~  replying.u.wit  pac
    (jab u.replying.u.wit |=(writ:c +<(replied (~(del in replied) ^id))))
  ::
      %add-feel
    %+  jab  id
    |=  =writ:c
    writ(feels (~(put by feels.writ) [p q]:act))
  ::
      %del-feel
    %+  jab  id
    |=  =writ:c
    writ(feels (~(del by feels.writ) p.act))
  ==
::  ingest new writs (on client)
::
++  reduce
  |=  =diff:writs:c
  ^+  pac
  :-  (walk:writs:c wit.pac diff)
  =<  +
  |-  ^-  index
  ?~  diff
    dex.pac
  =.  dex.pac
    ?~  q.n.diff
      (~(del by dex.pac) id.u.val.n.diff)
    (~(put by dex.pac) id.u.val.n.diff key.n.diff)
  =.  dex.pac  $(diff l.diff)
  =.  dex.pac  $(diff r.diff)
  dex.pac
::
++  peek
  |=  [care=@tas =(pole knot)]
  ^-  (unit (unit cage))
  =*  on   on:writs:c
  ?+    pole  [~ ~]
  ::
      [%newest count=@ ~]
    =/  count  (slav %ud count.pole)
    ``chat-writs+!>((gas:on *writs:c (top:mope wit.pac count)))
  ::
      [%older start=@ count=@ ~]
    =/  count  (slav %ud count.pole)
    =/  start  (slav %ud start.pole)
    ``chat-writs+!>((gas:on *writs:c (bat:mope wit.pac `start count)))
  ::
      [%newer start=@ count=@ ~]
    =/  count  (slav %ud count.pole)
    =/  start  (slav %ud start.pole)
    ``chat-writs+!>((gas:on *writs:c (tab:on wit.pac `start count)))
  ::
      [%writ %id ship=@ time=@ ~]
    =/  ship  (slav %p ship.pole)
    =/  time  (slav %ud time.pole)
    ?.  ?=(%u care)
      ``writ+!>((got ship `@da`time))
    ``flag+!>(?~((get ship `@da`time) | &))
  ==
--
