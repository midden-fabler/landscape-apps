/-  c=chat
/+  mp=mop-extensions
|_  pac=pact:c
++  mope  ((mp time (unit writ:c)) lte)
++  gas
  |=  ls=(list [=time wit=(unit writ:c)])
  ^+  pac
  %_    pac
      wit  (gas:on:writs:c wit.pac ls)
  ::
      dex  
    %-  ~(gas by dex.pac)
    %+  murn  ls
    |=  [=time wit=(unit writ:c)]
    ^-  (unit [id:c _time])
    ?~  wit
      ~
    `[id.u.wit time]
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
    ?~  got=(pry:on:writs:c unreads)  ~
    ?~  val.u.got  ~
    `id.u.val.u.got
  =/  count
    %-  lent
    %+  skim  ~(tap by unreads)
    |=  [tim=^time wit=(unit writ:c)]
    &(?=(^ wit) !=(author.u.wit our))
  [time count read-id]
::
++  get
  |=  =id:c
  ^-  (unit [=time =writ:c])
  ?~  tim=(~(get by dex.pac) id)
    ~
  ?~  wit=(get:on:writs:c wit.pac u.tim)
    ~
  ?~  u.wit
    ~
  `[u.tim u.u.wit]
::
++  jab
  |=  [=id:c fun=$-(writ:c writ:c)]
  ^+  pac
  ?~  v=(get id)  pac
  =.  wit.pac  (put:on:writs:c wit.pac time.u.v `(fun writ.u.v))
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
      (put:on:writs:c wit.pac now ~ seal p.act)
    =.  dex.pac  (~(put by dex.pac) id now)
    ?~  replying.p.act  pac
    =*  replying  u.replying.p.act
    (jab replying |=(writ:c +<(replied (~(put in replied) ^id))))
  ::
      %del
    =/  tim=(unit time)  (~(get by dex.pac) id)
    ?~  tim  pac
    =/  =time  (need tim)
    =/  wit=(unit (unit writ:c))  (get:on:writs:c wit.pac time)
    =.  wit.pac  (put:on:writs:c wit.pac time ~)
    =.  dex.pac  (~(del by dex.pac) id)
    ?~  wit  pac
    ?~  u.wit  pac
    ?~  replying.u.u.wit  pac
    (jab u.replying.u.u.wit |=(writ:c +<(replied (~(del in replied) ^id))))
  ::
      %add-feel
    %+  jab  id
    |=  =writ:c
    =/  rev=@ud
      ?~  old=(~(get by feels.writ) p.act)
        0
      +(rev.u.old)
    writ(feels (~(put by feels.writ) p.act rev `q.act))
  ::
      %del-feel
    %+  jab  id
    |=  =writ:c
    =/  rev=@ud
      ?~  old=(~(get by feels.writ) p.act)
        0
      +(rev.u.old)
    writ(feels (~(put by feels.writ) p.act rev ~))
  ==
::  ingest new writs (on client)
::
++  reduce
  |=  =diff:writs:c
  ^+  pac
  :-  (wash:writs:c wit.pac diff)
  |-  ^-  index:c
  ?~  diff
    dex.pac
  =.  dex.pac
    ?~  val.n.diff
      ?~  w=(get:on:writs:c wit.pac key.n.diff)
        dex.pac
      ?~  u.w
        dex.pac
      (~(del by dex.pac) id.u.u.w)
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
      [%around time=@ count=@ ~]
    =/  count  (slav %ud count.pole)
    =/  time  (slav %ud time.pole)
    =/  older  (bat:mope wit.pac `time count)
    =/  newer  (tab:on:writs:c wit.pac `time count)
    =/  writ   (get:on:writs:c wit.pac time)
    =-  ``chat-writs+!>(-)
    %+  gas:on  *writs:c
    ?~  writ
      (welp older newer)
    (welp (snoc older [time u.writ]) newer)
  ::
      [%writ %id ship=@ time=@ ~]
    =/  ship  (slav %p ship.pole)
    =/  time  (slav %ud time.pole)
    ?.  ?=(%u care)
      ``writ+!>((got ship `@da`time))
    ``flag+!>(?~((get ship `@da`time) | &))
  ==
::
++  search
  =<
    |%
    ++  mention
      |=  [sip=@ud len=@ud nedl=^ship]
      ^-  scan:c
      (scour sip len (mntn nedl))
    ++  text
      |=  [sip=@ud len=@ud nedl=@t]
      ^-  scan:c
      (scour sip len (txt nedl))
    --
  |%
  +$  query
    $:  skip=@ud
        more=@ud
        =scan:c
    ==
  ++  scour
    |=  [sip=@ud len=@ud matc=$-(writ:c ?)]
    ?>  (gth len 0)
    ^-  scan:c
    %-  flop
    =<  scan.-
    %^    (dop:mope query)
        wit.pac     :: (gas:on:writs:c wit.pac ls)
      [sip len ~]   :: (gas:on:quilt:h *quilt:h (bat:mope quilt `idx blanket-size))
    |=  $:  =query
            =time
            wit=(unit writ:c)
        ==
    ^-  [(unit (unit writ:c)) stop=? _query]
    :-  ~
    ?:  &(?=(^ wit) (matc u.wit))
      ?:  =(0 skip.query)
        :-  =(1 more.query)
        query(more (dec more.query), scan [[time `u.wit] scan.query])
      [| query(skip (dec skip.query))]
    [| query]
  ++  mntn
    |=  nedl=ship
    ^-  $-(writ:c ?)
    |=  =writ:c
    ^-  ?
    ?.  ?=(%story -.content.writ)
      |
    =/  ls=(list inline:c)   q.p.content.writ
    |-
    ?~  ls    |
    ?@  i.ls  $(ls t.ls)
    ?+  -.i.ls  $(ls t.ls)
      %ship                                  =(nedl p.i.ls)
      ?(%bold %italics %strike %blockquote)  |($(ls p.i.ls) $(ls t.ls))
    ==
  ::
  ++  txt
    |=  nedl=@t
    ^-  $-(writ:c ?)
    |=  =writ:c
    ^-  ?
    ?.  ?=(%story -.content.writ)
      |
    |^
      =/  ls=(list inline:c)  q.p.content.writ
      |-
      ?~  ls  |
      ?@  i.ls
        |((find nedl i.ls |) $(ls t.ls))
      ?.  ?=(?(%bold %italics %strike %blockquote) -.i.ls)
        $(ls t.ls)
      |($(ls p.i.ls) $(ls t.ls))
    ++  find
      |=  [nedl=@t hay=@t case=?]
      ^-  ?
      =/  nlen  (met 3 nedl)
      =/  hlen  (met 3 hay)
      ?:  (lth hlen nlen)
        |
      =?  nedl  !case
        (cass nedl)
      =/  pos  0
      =/  lim  (sub hlen nlen)
      |-
      ?:  (gth pos lim)
        |
      ?:  .=  nedl
          ?:  case
            (cut 3 [pos nlen] hay)
          (cass (cut 3 [pos nlen] hay))
        &
      $(pos +(pos))
    ++  cass
      |=  text=@t
      ^-  @t
      %^    run
          3
        text
      |=  dat=@
      ^-  @
      ?.  &((gth dat 64) (lth dat 91))
        dat
      (add dat 32)
    --
  --
--
