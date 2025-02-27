::  channels: diary, heap & chat channels for groups
::
::    this is the client side that pulls data from the channels-server.
::
::  XX  chat thread entries can no longer be edited.  maybe fix before
::      release?
::
/-  c=channels, g=groups, ha=hark
/-  meta
/+  default-agent, verb, dbug, sparse, neg=negotiate
/+  utils=channel-utils, volume
::  performance, keep warm
/+  channel-json
::
%-  %-  agent:neg
    :+  notify=&
      [~.channels^%1 ~ ~]
    [%channels-server^[~.channels^%1 ~ ~] ~ ~]
%-  agent:dbug
%+  verb  |
::
^-  agent:gall
=>
  |%
  +$  card  card:agent:gall
  +$  current-state
    $:  %2
        =v-channels:c
        voc=(map [nest:c plan:c] (unit said:c))
        pins=(list nest:c)  ::TODO  vestigial, in groups-ui now, remove me
        hidden-posts=(set id-post:c)
      ::
        ::  .pending-ref-edits: for migration, see also +poke %negotiate-notif
        ::
        pending-ref-edits=(jug ship [=kind:c name=term])
    ==
  --
=|  current-state
=*  state  -
=<
  |_  =bowl:gall
  +*  this  .
      def   ~(. (default-agent this %|) bowl)
      cor   ~(. +> [bowl ~])
  ++  on-init
    ^-  (quip card _this)
    =^  cards  state
      abet:init:cor
    [cards this]
  ::
  ++  on-save  !>([state])
  ++  on-load
    |=  =vase
    ^-  (quip card _this)
    =^  cards  state
      abet:(load:cor vase)
    [cards this]
  ::
  ++  on-poke
    |=  [=mark =vase]
    ^-  (quip card _this)
    =^  cards  state
      abet:(poke:cor mark vase)
    [cards this]
  ::
  ++  on-watch
    |=  =path
    ^-  (quip card _this)
    =^  cards  state
      abet:(watch:cor path)
    [cards this]
  ::
  ++  on-peek    peek:cor
  ++  on-leave   on-leave:def
  ++  on-fail    on-fail:def
  ++  on-agent
    |=  [=wire =sign:agent:gall]
    ^-  (quip card _this)
    =^  cards  state
      abet:(agent:cor wire sign)
    [cards this]
  ::
  ++  on-arvo
    |=  [=wire sign=sign-arvo]
    ^-  (quip card _this)
    ~&  strange-diary-arvo+wire
    `this
  --
|_  [=bowl:gall cards=(list card)]
++  abet  [(flop cards) state]
++  cor   .
++  emit  |=(=card cor(cards [card cards]))
++  emil  |=(caz=(list card) cor(cards (welp (flop caz) cards)))
++  give  |=(=gift:agent:gall (emit %give gift))
++  server  (cat 3 dap.bowl '-server')
::
::  does not overwite if wire and dock exist.  maybe it should
::  leave/rewatch if the path differs?
::
++  safe-watch
  |=  [=wire =dock =path]
  ^+  cor
  ?:  (~(has by wex.bowl) wire dock)  cor
  (emit %pass wire %agent dock %watch path)
::
++  load
  |=  =vase
  |^  ^+  cor
  =+  !<(old=versioned-state vase)
  =?  old  ?=(%0 -.old)  (state-0-to-1 old)
  =?  old  ?=(%1 -.old)  (state-1-to-2 old)
  ?>  ?=(%2 -.old)
  =.  state  old
  inflate-io
  ::
  +$  versioned-state  $%(state-2 state-1 state-0)
  +$  state-2  current-state
  ::
  +$  state-1
    $:  %1
        v-channels=(map nest:c v-channel-1)
        voc=(map [nest:c plan:c] (unit said:c))
        pins=(list nest:c)
        hidden-posts=(set id-post:c)
    ==
  ++  v-channel-1
    |^  ,[global local]
    +$  global
      $:  posts=v-posts-1
          order=(rev:c order=arranged-posts:c)
          view=(rev:c =view:c)
          sort=(rev:c =sort:c)
          perm=(rev:c =perm:c)
      ==
    +$  window    window:v-channel:c
    +$  future    [=window diffs=(jug id-post:c u-post-1)]
    +$  local     [=net:c log=log-1 =remark:c =window =future]
    --
  +$  log-1           ((mop time u-channel-1) lte)
  ++  log-on-1        ((on time u-channel-1) lte)
  +$  u-channel-1     $%  $<(%post u-channel:c)
                          [%post id=id-post:c u-post=u-post-1]
                      ==
  +$  u-post-1        $%  $<(?(%set %reply) u-post:c)
                          [%set post=(unit v-post-1)]
                          [%reply id=id-reply:c u-reply=u-reply-1]
                      ==
  +$  u-reply-1       $%  $<(%set u-reply:c)
                          [%set reply=(unit v-reply-1)]
                      ==
  +$  v-posts-1       ((mop id-post:c (unit v-post-1)) lte)
  ++  on-v-posts-1    ((on id-post:c (unit v-post-1)) lte)
  +$  v-post-1        [v-seal-1 (rev:c essay:c)]
  +$  v-seal-1        [id=id-post:c replies=v-replies-1 reacts=v-reacts:c]
  +$  v-replies-1     ((mop id-reply:c (unit v-reply-1)) lte)
  ++  on-v-replies-1  ((on id-reply:c (unit v-reply-1)) lte)
  +$  v-reply-1       [v-reply-seal:c memo:c]
  ++  state-1-to-2
    |=  s=state-1
    ^-  state-2
    =/  pend=(jug ship [=kind:c name=term])
      %-  ~(gas ju *(jug ship [kind:c term]))
      %+  turn  ~(tap in ~(key by v-channels.s))
      |=(nest:c [ship kind name])
    %=  s
      -  %2
      v-channels    (~(run by v-channels.s) v-channel-1-to-2)
      hidden-posts  [hidden-posts.s pend]
    ==
  ++  v-channel-1-to-2
    |=  v=v-channel-1
    %=  v
      posts   (v-posts-1-to-2 posts.v)
      log     (log-1-to-2 log.v)
      future  (future-1-to-2 future.v)
    ==
  ++  log-1-to-2
    |=  l=log-1
    (run:log-on-1 l u-channel-1-to-2)
  ++  u-channel-1-to-2
    |=  u=u-channel-1
    ^-  u-channel:c
    ?.  ?=([%post *] u)  u
    u(u-post (u-post-1-to-2 u-post.u))
  ++  future-1-to-2
    |=  f=future:v-channel-1
    ^-  future:v-channel:c
    f(diffs (~(run by diffs.f) |=(s=(set u-post-1) (~(run in s) u-post-1-to-2))))
  ++  u-post-1-to-2
    |=  u=u-post-1
    ^-  u-post:c
    ?+  u  u
      [%set ~ *]           u(u.post (v-post-1-to-2 u.post.u))
      [%reply * %set ~ *]  u(u.reply.u-reply (v-reply-1-to-2 u.reply.u-reply.u))
    ==
  ++  v-posts-1-to-2
    |=  p=v-posts-1
    %+  run:on-v-posts-1  p
    |=(p=(unit v-post-1) ?~(p ~ `(v-post-1-to-2 u.p)))
  ++  v-post-1-to-2
    |=(p=v-post-1 p(replies (v-replies-1-to-2 replies.p)))
  ++  v-replies-1-to-2
    |=  r=v-replies-1
    %+  run:on-v-replies-1  r
    |=(r=(unit v-reply-1) ?~(r ~ `(v-reply-1-to-2 u.r)))
  ++  v-reply-1-to-2
    |=(r=v-reply-1 `v-reply:c`[-.r 0 +.r])
  ::
  ::  %0 to %1
  ::
  +$  state-0
    $:  %0
        v-channels=(map nest:c v-channel-0)
        voc=(map [nest:c plan:c] (unit said:c))
        pins=(list nest:c)
        hidden-posts=(set id-post:c)
    ==
  ++  v-channel-0
    |^  ,[global:v-channel-1 local]
    +$  window    window:v-channel:c
    +$  future    [=window diffs=(jug id-post:c u-post-1)]
    +$  local     [=net:c log=log-1 remark=remark-0 =window =future]
    --
  +$  remark-0  [last-read=time watching=_| unread-threads=(set id-post:c)]
  ::
  ++  state-0-to-1
    |=  s=state-0
    ^-  state-1
    s(- %1, v-channels (~(run by v-channels.s) v-channel-0-to-1))
  ++  v-channel-0-to-1
    |=  v=v-channel-0
    ^-  v-channel-1
    =/  recency=time
      ?~(tim=(ram:on-v-posts-1 posts.v) *time key.u.tim)
    v(remark [recency remark.v])
  --
::
++  init
  ^+  cor
  ::NOTE  poking diary/heap/chat with %*-migrate is done by channels-server,
  ::      because it is important the server migration happens before those
  ::      happen. that way, local subs get established without issue.
  inflate-io
::
++  inflate-io
  ::  initiate version negotiation with our own channels-server
  ::
  =.  cor  (emit (initiate:neg our.bowl server))
  ::  leave all subscriptions we don't recognize
  ::
  =.  cor
    %+  roll
      ~(tap by wex.bowl)
    |=  [[[=(pole knot) sub-ship=ship =dude:gall] acked=? =path] core=_cor]
    =.  cor  core
    =/  keep=?
      ?+    pole  |
          [%groups *]  &(=(%groups dude) =(our.bowl ship) =(/groups path))
          [=kind:c ship=@ name=@ %updates ~]
        ?.  =(server dude)  |
        ?.  =((scot %p sub-ship) ship.pole)  |
        ?~  diary=(~(get by v-channels) kind.pole sub-ship name.pole)  |
        ?.  ?=([kind:c @ %updates ?(~ [@ ~])] path)  |
        ?.  =(kind.pole i.path)  |
        =(name.pole i.t.path)
      ::
          [=kind:c ship=@ name=@ %checkpoint ~]
        ?.  =(server dude)  |
        ?.  =((scot %p sub-ship) ship.pole)  |
        ?~  diary=(~(get by v-channels) kind.pole sub-ship name.pole)  |
        ?.  ?=([kind:c @ %checkpoint %before @] path)  |
        ?.  =(kind.pole i.path)  |
        =(name.pole i.t.path)
      ::
          [%said =kind:c ship=@ name=@ %post time=@ reply=?(~ [@ ~])]
        ?.  =(server dude)  |
        ?.  =((scot %p sub-ship) ship.pole)  |
        ?~  pplan=(slaw %ud time.pole)  |
        =/  qplan=(unit (unit time))
          ?~  reply.pole  `~
          ?~  q=(slaw %ud -.reply.pole)  ~
          ``u.q
        ?~  qplan  |
        ?.  (~(has by voc) [kind.pole sub-ship name.pole] u.pplan u.qplan)  |
        =(wire path)
      ==
    ?:  keep  cor
    (emit %pass pole %agent [sub-ship dude] %leave ~)
  ::
  ::  watch all the subscriptions we expect to have
  ::
  =.  cor  watch-groups
  ::
  =.  cor
    %+  roll
      ~(tap by v-channels)
    |=  [[=nest:c *] core=_cor]
    ca-abet:ca-safe-sub:(ca-abed:ca-core:core nest)
  ::
  cor
::
++  poke
  |=  [=mark =vase]
  ^+  cor
  ?+    mark  ~|(bad-poke+mark !!)
    :: TODO: add transfer/import channels
      %channel-action
    =+  !<(=a-channels:c vase)
    ?:  ?=(%create -.a-channels)
      ca-abet:(ca-create:ca-core create-channel.a-channels)
    ?:  ?=(%pin -.a-channels)
      ~&  %channels-vestigial-pin-action
      ?>  from-self
      cor(pins pins.a-channels)
    ?:  ?=(%toggle-post -.a-channels)
      ?>  from-self
      (toggle-post toggle.a-channels)
    ?:  ?=(%join -.a-channel.a-channels)
      ca-abet:(ca-join:ca-core [nest group.a-channel]:a-channels)
    ca-abet:(ca-a-channel:(ca-abed:ca-core nest.a-channels) a-channel.a-channels)
  ::
      %channel-migration
    ?>  =(our src):bowl
    =+  !<(new-channels=v-channels:c vase)
    =.  v-channels
      %+  roll  ~(tap by new-channels)
      |=  [[n=nest:c c=v-channel:c] =_v-channels]
      ?~  hav=(~(get by v-channels) n)
        (~(put by v-channels) n c)
      ::  if we already have the channel, only replace it with the import if
      ::  the one we have right now is empty. otherwise, keep what we already
      ::  have, lest we lose newer data.
      ::
      ?.  =(~ posts.u.hav)  v-channels
      (~(put by v-channels) n c)
    ::  after migration, references to chat msgs have changed. we want to
    ::  notify the host about these edits, but not right now: we aren't sure
    ::  they have migrated yet. store affected channels in state, we will send
    ::  edits on a per-host basis when handling %negotiate-notification below.
    ::
    =.  pending-ref-edits
      %-  ~(gas ju pending-ref-edits)
      ^-  (list [ship kind:c term])
      %+  turn  ~(tap in ~(key by new-channels))
      |=(nest:c [ship kind name])
    inflate-io
  ::
      %channel-migration-pins
    ?>  =(our src):bowl
    =+  !<(new-pins=(list nest:c) vase)
    =.  pins  (weld pins new-pins)
    cor
  ::
      %negotiate-notification
    ::  during migration, references to chat msgs were changed. we want to
    ::  notify channel hosts about these edits, but not before they themselves
    ::  have migrated (lest we risk front-running their internal migration
    ::  pokes, causing our edits to fail).
    ::  a version negotiation notification guarantees that they have migrated,
    ::  so based off that we trigger the editing of our messages that changed.
    ::  (see also %*-migrate-refs poke handling in the old agents.)
    ::
    ?>  =(our src):bowl
    =+  !<([match=? =gill:gall] vase)
    ?.  match
      cor
    ?.  =(%channels-server q.gill)
      cor
    =*  host  p.gill
    ?~  pend=(~(get by pending-ref-edits) host)
      cor
    =.  pending-ref-edits
      (~(del by pending-ref-edits) host)
    %-  emil
    %+  turn  ~(tap by u.pend)
    |=  [=kind:c name=term]
    ^-  card
    :+  %pass   /migrate
    :+  %agent  [our.bowl kind]
    :+  %poke
      ::NOTE  %chat-migrate-refs, etc
      (cat 3 kind '-migrate-refs')
    !>([host name])
  ==
  ++  toggle-post
    |=  toggle=post-toggle:c
    ^+  cor
    =.  hidden-posts
      ?-  -.toggle
        %hide  (~(put in hidden-posts) id-post.toggle)
        %show  (~(del in hidden-posts) id-post.toggle)
      ==
    (give %fact ~[/] toggle-post+!>(toggle))
  ::
::
++  watch
  |=  =(pole knot)
  ^+  cor
  ?+    pole  ~|(bad-watch-path+pole !!)
      ~                          ?>(from-self cor)
      [%unreads ~]               ?>(from-self cor)
      [=kind:c ship=@ name=@ ~]  ?>(from-self cor)
      [%said =kind:c host=@ name=@ %post time=@ reply=?(~ [@ ~])]
    =/  host=ship   (slav %p host.pole)
    =/  =nest:c     [kind.pole host name.pole]
    =/  =plan:c     =,(pole [(slav %ud time) ?~(reply ~ `(slav %ud -.reply))])
    (watch-said nest plan)
  ==
::
++  watch-said
  |=  [=nest:c =plan:c]
  ?.  (~(has by v-channels) nest)
    =/  wire  (said-wire nest plan)
    (safe-watch wire [ship.nest server] wire)
  ::TODO  not guaranteed to resolve, we might have partial backlog
  ca-abet:(ca-said:(ca-abed:ca-core nest) plan)
::
++  said-wire
  |=  [=nest:c =plan:c]
  ^-  wire
  %+  welp
    /said/[kind.nest]/(scot %p ship.nest)/[name.nest]/post/(scot %ud p.plan)
  ?~(q.plan / /(scot %ud u.q.plan))
::
++  take-said
  |=  [=nest:c =plan:c =sign:agent:gall]
  =/  =wire  (said-wire nest plan)
  ^+  cor
  ?+    -.sign  !!
      %watch-ack
    %.  cor
    ?~  p.sign  same
    (slog leaf+"Preview failed" u.p.sign)
  ::
      %kick
    ?:  (~(has by voc) nest plan)
      cor  :: subscription ended politely
    (give %kick ~[wire] ~)
  ::
      %fact
    =.  cor  (give %fact ~[wire] cage.sign)
    =.  cor  (give %kick ~[wire] ~)
    ?+    p.cage.sign  ~|(funny-mark+p.cage.sign !!)
        %channel-denied  cor(voc (~(put by voc) [nest plan] ~))
        %channel-said
      =+  !<(=said:c q.cage.sign)
      cor(voc (~(put by voc) [nest plan] `said))
    ==
  ==
::
++  agent
  |=  [=(pole knot) =sign:agent:gall]
  ^+  cor
  ?+    pole  ~|(bad-agent-wire+pole !!)
      ~          cor
      [%hark ~]
    ?>  ?=(%poke-ack -.sign)
    ?~  p.sign  cor
    %-  (slog leaf+"Failed to hark" u.p.sign)
    cor
  ::
      [=kind:c ship=@ name=@ rest=*]
    =/  =ship  (slav %p ship.pole)
    ca-abet:(ca-agent:(ca-abed:ca-core kind.pole ship name.pole) rest.pole sign)
  ::
      [%said =kind:c host=@ name=@ %post time=@ reply=?(~ [@ ~])]
    =/  host=ship   (slav %p host.pole)
    =/  =nest:c     [kind.pole host name.pole]
    =/  =plan:c     =,(pole [(slav %ud time) ?~(reply ~ `(slav %ud -.reply))])
    (take-said nest plan sign)
  ::
      [%groups ~]
    ?+    -.sign  !!
        %kick       watch-groups
        %watch-ack
      ?~  p.sign
        cor
      =/  =tank
        leaf+"Failed groups subscription in {<dap.bowl>}, unexpected"
      ((slog tank u.p.sign) cor)
    ::
        %fact
      ?.  =(act:mar:g p.cage.sign)  cor
      (take-groups !<(=action:g q.cage.sign))
    ==
  ::
      [%migrate ~]
    ?+  -.sign  !!
        %poke-ack
      ?~  p.sign  cor
      %-  (slog 'channels: migration poke failure' >wire< u.p.sign)
      cor
    ==
  ==
::
++  watch-groups  (safe-watch /groups [our.bowl %groups] /groups)
::
++  take-groups
  |=  =action:g
  =/  affected=(list nest:c)
    %+  murn  ~(tap by v-channels)
    |=  [=nest:c channel=v-channel:c]
    ?.  =(p.action group.perm.perm.channel)  ~
    `nest
  =/  diff  q.q.action
  ?+    diff  cor
      [%fleet * %add-sects *]    (recheck-perms affected ~)
      [%fleet * %del-sects *]    (recheck-perms affected ~)
      [%channel * %edit *]       (recheck-perms affected ~)
      [%channel * %del-sects *]  (recheck-perms affected ~)
      [%channel * %add-sects *]  (recheck-perms affected ~)
      [%cabal * %del *]
    =/  =sect:g  (slav %tas p.diff)
    %+  recheck-perms  affected
    (~(gas in *(set sect:g)) ~[p.diff])
  ==
::
++  recheck-perms
  |=  [affected=(list nest:c) sects=(set sect:g)]
  ~&  "%channel recheck permissions for {<affected>}"
  %+  roll  affected
  |=  [=nest:c co=_cor]
  =/  ca  (ca-abed:ca-core:co nest)
  ca-abet:(ca-recheck:ca sects)
::
++  peek
  |=  =(pole knot)
  ^-  (unit (unit cage))
  ?+    pole  [~ ~]
      [%x %channels ~]   ``channels+!>((uv-channels:utils v-channels))
      [%x %init ~]    ``noun+!>([unreads (uv-channels:utils v-channels)])
      [%x %hidden-posts ~]  ``hidden-posts+!>(hidden-posts)
      [%x %unreads ~]  ``channel-unreads+!>(unreads)
      [%x =kind:c ship=@ name=@ rest=*]
    =/  =ship  (slav %p ship.pole)
    (ca-peek:(ca-abed:ca-core kind.pole ship name.pole) rest.pole)
  ::
      [%u =kind:c ship=@ name=@ ~]
    =/  =ship  (slav %p ship.pole)
    ``loob+!>((~(has by v-channels) kind.pole ship name.pole))
  ==
::
++  unreads
  ^-  unreads:c
  %-  ~(gas by *unreads:c)
  %+  turn  ~(tap in ~(key by v-channels))
  |=  =nest:c
  [nest ca-unread:(ca-abed:ca-core nest)]
::
++  pass-hark
  |=  =new-yarn:ha
  ^-  card
  =/  =cage  hark-action-1+!>([%new-yarn new-yarn])
  [%pass /hark %agent [our.bowl %hark] %poke cage]
::
++  from-self  =(our src):bowl
::
++  ca-core
  |_  [=nest:c channel=v-channel:c gone=_|]
  ++  ca-core  .
  ++  emit  |=(=card ca-core(cor (^emit card)))
  ++  emil  |=(caz=(list card) ca-core(cor (^emil caz)))
  ++  give  |=(=gift:agent:gall ca-core(cor (^give gift)))
  ++  safe-watch  |=([=wire =dock =path] ca-core(cor (^safe-watch +<)))
  ++  ca-perms  ~(. perms:utils our.bowl now.bowl nest group.perm.perm.channel)
  ++  ca-abet
    %_    cor
        v-channels
      ?:(gone (~(del by v-channels) nest) (~(put by v-channels) nest channel))
    ==
  ++  ca-abed
    |=  n=nest:c
    ca-core(nest n, channel (~(got by v-channels) n))
  ::
  ++  ca-area  `path`/[kind.nest]/(scot %p ship.nest)/[name.nest]
  ++  ca-sub-wire  (weld ca-area /updates)
  ++  ca-give-unread
    (give %fact ~[/unreads] channel-unread-update+!>([nest ca-unread]))
::
  ::
  ::  handle creating a channel
  ::
  ++  ca-create
    |=  create=create-channel:c
    ?>  from-self
    =.  nest  [kind.create our.bowl name.create]
    ?<  (~(has by v-channels) nest)
    =.  channel  *v-channel:c
    =.  group.perm.perm.channel  group.create
    =.  last-read.remark.channel  now.bowl
    =/  =cage  [%channel-command !>([%create create])]
    (emit %pass (weld ca-area /create) %agent [our.bowl server] %poke cage)
  ::
  ::  handle joining a channel
  ::
  ++  ca-join
    |=  [n=nest:c group=flag:g]
    =.  nest  n
    ?<  (~(has by v-channels) nest)
    ?>  |(=(p.group src.bowl) from-self)
    =.  channel  *v-channel:c
    =.  group.perm.perm.channel  group
    =.  last-read.remark.channel  now.bowl
    =.  ca-core  ca-give-unread
    =.  ca-core  (ca-response %join group)
    ca-safe-sub
  ::
  ::  handle an action from the client
  ::
  ::    typically this will either handle the action directly (for local
  ::    things like marking channels read) or proxy the request to the
  ::    host (for global things like posting a post).
  ::
  ++  ca-a-channel
    |=  =a-channel:c
    ?>  from-self
    ?+  -.a-channel  (ca-send-command [%channel nest a-channel])
      %join       !!  ::  handled elsewhere
      %leave      ca-leave
      ?(%read %read-at %watch %unwatch)  (ca-a-remark a-channel)
    ==
  ::
  ++  ca-a-remark
    |=  =a-remark:c
    ^+  ca-core
    =.  remark.channel
      ?-    -.a-remark
          %watch    remark.channel(watching &)
          %unwatch  remark.channel(watching |)
          %read-at  !!  ::TODO
          %read
        ::  set read marker at time of latest content. conveniently, we can use
        ::  the always-up-to-date recency for that.
        ::  we don't use now.bowl, because we may still receive content
        ::  with ids before now.bowl
        ::
        %_  remark.channel
          last-read       (add recency.remark.channel (div ~s1 100))
          unread-threads  ~
        ==
      ==
    =.  ca-core  ca-give-unread
    (ca-response a-remark)
  ::
  ::  proxy command to host
  ::
  ++  ca-send-command
    |=  command=c-channels:c
    ^+  ca-core
    ?>  ?=(%channel -.command)
    ::  don't allow anyone else to proxy through us
    ?.  =(src.bowl our.bowl)
      ~|("%channel-action poke failed: only allowed from self" !!)
    ::  if we're interacting with a channel that means we've read it
    =?  remark.channel  ?=(%post -.c-channel.command)
      %=  remark.channel
        last-read       `@da`(add now.bowl (div ~s1 100))
        unread-threads  *(set id-post:c)
      ==
    =/  =cage  [%channel-command !>(command)]
    ::  NB: we must have already subscribed to something from this ship,
    ::  so that we have negotiated a matching version.  If we want to do
    ::  anything in particular on a mismatched version, we can call
    ::  +can-poke:neg.
    ::
    (emit %pass ca-area %agent [ship.nest.command server] %poke cage)
  ::
  ::  handle a said (previews) request where we have the data to respond
  ::
  ++  ca-said
    |=  =plan:c
    ^+  ca-core
    =.  ca-core
      %^  give  %fact  ~
      ?.  (can-read:ca-perms src.bowl)
        channel-denied+!>(~)
      (said:utils nest plan posts.channel)
    (give %kick ~ ~)
  ::
  ++  ca-has-sub
    ^-  ?
    (~(has by wex.bowl) [ca-sub-wire ship.nest dap.bowl])
  ::
  ++  ca-safe-sub
    ?:  ca-has-sub  ca-core
    ?^  posts.channel  ca-start-updates
    =.  load.net.channel  |
    %^  safe-watch  (weld ca-area /checkpoint)  [ship.nest server]
    ?.  =(our.bowl ship.nest)
      =/  count  ?:(=(%diary kind.nest) '20' '100')
      /[kind.nest]/[name.nest]/checkpoint/before/[count]
    /[kind.nest]/[name.nest]/checkpoint/time-range/(scot %da *@da)
  ::
  ++  ca-start-updates
    ::  not most optimal time, should maintain last heard time instead
    =/  tim=(unit time)
      (bind (ram:on-v-posts:c posts.channel) head)
    %^  safe-watch  ca-sub-wire  [ship.nest server]
    /[kind.nest]/[name.nest]/updates/(scot %da (fall tim *@da))
  ::
  ++  ca-agent
    |=  [=wire =sign:agent:gall]
    ^+  ca-core
    ?+    wire  ~|(channel-strange-agent-wire+wire !!)
      ~  ca-core  :: noop wire, should only send pokes
      [%create ~]       (ca-take-create sign)
      [%updates ~]      (ca-take-update sign)
      [%backlog ~]      (ca-take-backlog sign)
      [%checkpoint ~]   (ca-take-checkpoint sign)
    ==
  ::
  ++  ca-take-create
    |=  =sign:agent:gall
    ^+  ca-core
    ?-    -.sign
        %poke-ack
      =+  ?~  p.sign  ~
          %-  (slog leaf+"{<dap.bowl>}: Failed creation (poke)" u.p.sign)
          ~
      =/  =path  /[kind.nest]/[name.nest]/create
      =/  =wire  (weld ca-area /create)
      (emit %pass wire %agent [our.bowl server] %watch path)
    ::
        %kick       ca-safe-sub
        %watch-ack
      ?~  p.sign  ca-core
      %-  (slog leaf+"{<dap.bowl>}: Failed creation" u.p.sign)
      ca-core
    ::
        %fact
      =*  cage  cage.sign
      ?.  =(%channel-update p.cage)
        ~|(diary-strange-fact+p.cage !!)
      =+  !<(=update:c q.cage)
      =.  ca-core  (ca-u-channels update)
      =.  ca-core  ca-give-unread
      =.  ca-core
        (emit %pass (weld ca-area /create) %agent [ship.nest server] %leave ~)
      ca-safe-sub
    ==
  ::
  ++  ca-take-update
    |=  =sign:agent:gall
    ^+  ca-core
    ?+    -.sign  ca-core
        %kick       ca-safe-sub
        %watch-ack
      ?~  p.sign  ca-core
      %-  (slog leaf+"{<dap.bowl>}: Failed subscription" u.p.sign)
      ca-core
    ::
        %fact
      =*  cage  cage.sign
      ?+  p.cage  ~|(channel-strange-fact+p.cage !!)
        %channel-logs    (ca-apply-logs !<(log:c q.cage))
        %channel-update  (ca-u-channels !<(update:c q.cage))
      ==
    ==
  ::
  ++  ca-take-checkpoint
    |=  =sign:agent:gall
    ^+  ca-core
    ?+    -.sign  ca-core
        :: only if kicked prematurely
        %kick       ?:(load.net.channel ca-core ca-safe-sub)
        %watch-ack
      ?~  p.sign  ca-core
      %-  (slog leaf+"{<dap.bowl>}: Failed partial checkpoint" u.p.sign)
      ca-core
    ::
        %fact
      =*  cage  cage.sign
      ?+    p.cage  ~|(diary-strange-fact+p.cage !!)
          %channel-checkpoint
        (ca-ingest-checkpoint !<(u-checkpoint:c q.cage))
      ==
    ==
  ::
  ++  ca-take-backlog
    |=  =sign:agent:gall
    ^+  ca-core
    ?+    -.sign  ca-core
        ::  only hit if kicked prematurely (we %leave after the first %fact)
        %kick  ca-sync-backlog
        %watch-ack
      ?~  p.sign  ca-core
      %-  (slog leaf+"{<dap.bowl>}: Failed backlog" u.p.sign)
      ca-core
    ::
        %fact
      =*  cage  cage.sign
      ?+    p.cage  ~|(diary-strange-fact+p.cage !!)
          %channel-checkpoint
        (ca-ingest-backlog !<(u-checkpoint:c q.cage))
      ==
    ==
  ::
  ++  ca-ingest-checkpoint
    |=  chk=u-checkpoint:c
    ^+  ca-core
    =.  load.net.channel  &
    =.  ca-core  (ca-apply-checkpoint chk &)
    =.  ca-core  ca-start-updates
    =.  ca-core  ca-sync-backlog
    =/  wire  (weld ca-area /checkpoint)
    (emit %pass wire %agent [ship.nest server] %leave ~)
  ::
  ++  ca-apply-checkpoint
    |=  [chk=u-checkpoint:c send=?]
    =^  changed  sort.channel  (apply-rev:c sort.channel sort.chk)
    =?  ca-core  &(changed send)  (ca-response %sort sort.sort.channel)
    =^  changed  view.channel  (apply-rev:c view.channel view.chk)
    =?  ca-core  &(changed send)  (ca-response %view view.view.channel)
    =^  changed  perm.channel  (apply-rev:c perm.channel perm.chk)
    =?  ca-core  &(changed send)  (ca-response %perm perm.perm.channel)
    =^  changed  order.channel  (apply-rev:c order.channel order.chk)
    =?  ca-core  &(changed send)  (ca-response %order order.order.channel)
    =/  old  posts.channel
    =.  posts.channel
      ((uno:mo-v-posts:c posts.channel posts.chk) ca-apply-unit-post)
    =?  ca-core  &(send !=(old posts.channel))
      %+  ca-response  %posts
      %+  gas:on-posts:c  *posts:c
      %+  murn  (turn (tap:on-v-posts:c posts.chk) head)
      |=  id=id-post:c
      ^-  (unit [id-post:c (unit post:c)])
      =/  post  (got:on-v-posts:c posts.channel id)
      =/  old   (get:on-v-posts:c old id)
      ?:  =(old `post)  ~
      ?~  post  (some [id ~])
      (some [id `(uv-post:utils u.post)])
    ca-core
  ::
  ++  ca-sync-backlog
    =/  checkpoint-start  (pry:on-v-posts:c posts.channel)
    ?~  checkpoint-start  ca-core
    %^  safe-watch  (weld ca-area /backlog)  [ship.nest server]
    %+  welp
      /[kind.nest]/[name.nest]/checkpoint/time-range
    ~|  `*`key.u.checkpoint-start
    /(scot %da *@da)/(scot %da key.u.checkpoint-start)
  ::
  ++  ca-ingest-backlog
    |=  chk=u-checkpoint:c
    =.  ca-core  (ca-apply-checkpoint chk |)
    =/  wire  (weld ca-area /backlog)
    (emit %pass wire %agent [ship.nest server] %leave ~)
  ::
  ++  ca-apply-logs
    |=  =log:c
    ^+  ca-core
    %+  roll  (tap:log-on:c log)
    |=  [[=time =u-channel:c] ca=_ca-core]
    (ca-u-channels:ca time u-channel)
  ::
  ::  +ca-u-* functions ingest updates and execute them
  ::
  ::    often this will modify the state and emit a "response" to our
  ::    own subscribers.  it may also emit unreads and/or trigger hark
  ::    events.
  ::
  ++  ca-u-channels
    |=  [=time =u-channel:c]
    ?>  ca-from-host
    ^+  ca-core
    ?-    -.u-channel
        %create
      ?.  =(0 rev.perm.channel)  ca-core
      =.  perm.perm.channel  perm.u-channel
      (ca-response %create perm.u-channel)
    ::
        %order
      =^  changed  order.channel  (apply-rev:c order.channel +.u-channel)
      ?.  changed  ca-core
      (ca-response %order order.order.channel)
    ::
        %view
      =^  changed  view.channel  (apply-rev:c view.channel +.u-channel)
      ?.  changed  ca-core
      (ca-response %view view.view.channel)
    ::
        %sort
      =^  changed  sort.channel  (apply-rev:c sort.channel +.u-channel)
      ?.  changed  ca-core
      (ca-response %sort sort.sort.channel)
    ::
        %perm
      =^  changed  perm.channel  (apply-rev:c perm.channel +.u-channel)
      ?.  changed  ca-core
      (ca-response %perm perm.perm.channel)
    ::
        %post
      =/  old  posts.channel
      =.  ca-core  (ca-u-post id.u-channel u-post.u-channel)
      =?  ca-core  !=(old posts.channel)  ca-give-unread
      ca-core
    ==
  ::
  ++  ca-u-post
    |=  [=id-post:c =u-post:c]
    ^+  ca-core
    =/  post  (get:on-v-posts:c posts.channel id-post)
    ?:  ?=([~ ~] post)  ca-core
    ?:  ?=(%set -.u-post)
      =?  recency.remark.channel  ?=(^ post.u-post)
        (max recency.remark.channel id-post)
      ?~  post
        =/  post=(unit post:c)  (bind post.u-post uv-post:utils)
        =?  ca-core  ?=(^ post.u-post)
          ::TODO  what about the "mention was added during edit" case?
          (on-post:ca-hark id-post u.post.u-post)
        =.  posts.channel  (put:on-v-posts:c posts.channel id-post post.u-post)
        (ca-response %post id-post %set post)
      ::
      ?~  post.u-post
        =.  posts.channel  (put:on-v-posts:c posts.channel id-post ~)
        (ca-response %post id-post %set ~)
      ::
      =*  old  u.u.post
      =*  new  u.post.u-post
      =/  merged  (ca-apply-post id-post old new)
      ?:  =(merged old)  ca-core
      =.  posts.channel  (put:on-v-posts:c posts.channel id-post `merged)
      (ca-response %post id-post %set `(uv-post:utils merged))
    ::
    ?~  post
      =.  diffs.future.channel
        ::  if the item affected by the update is not in the window we
        ::  care about, ignore it. otherwise, put it in the pending
        ::  diffs set.
        ::
        ?.  (~(has as:sparse window.future.channel) id-post)
          diffs.future.channel
        (~(put ju diffs.future.channel) id-post u-post)
      ca-core
    ::
    ?-    -.u-post
        %reply  (ca-u-reply id-post u.u.post id.u-post u-reply.u-post)
        %reacts
      =/  merged  (ca-apply-reacts reacts.u.u.post reacts.u-post)
      ?:  =(merged reacts.u.u.post)  ca-core
      =.  posts.channel
        (put:on-v-posts:c posts.channel id-post `u.u.post(reacts merged))
      (ca-response %post id-post %reacts (uv-reacts:utils merged))
    ::
        %essay
      =^  changed  +.u.u.post  (apply-rev:c +.u.u.post +.u-post)
      ?.  changed  ca-core
      =.  posts.channel  (put:on-v-posts:c posts.channel id-post `u.u.post)
      (ca-response %post id-post %essay +>.u.u.post)
    ==
  ::
  ++  ca-u-reply
    |=  [=id-post:c post=v-post:c =id-reply:c =u-reply:c]
    ^+  ca-core
    |^
    =/  reply  (get:on-v-replies:c replies.post id-reply)
    ?:  ?=([~ ~] reply)  ca-core
    ?:  ?=(%set -.u-reply)
      ?~  reply
        =/  reply=(unit reply:c)
          ?~  reply.u-reply  ~
          `(uv-reply:utils id-post u.reply.u-reply)
        =?  ca-core  ?=(^ reply.u-reply)
          (on-reply:ca-hark id-post post u.reply.u-reply)
        (put-reply reply.u-reply %set reply)
      ::
      ?~  reply.u-reply  (put-reply ~ %set ~)
      ::
      =*  old  u.u.reply
      =*  new  u.reply.u-reply
      =/  merged  (need (ca-apply-reply id-reply `old `new))
      ?:  =(merged old)  ca-core
      (put-reply `merged %set `(uv-reply:utils id-post merged))
    ::
    ?~  reply  ca-core
    ::
    =/  merged  (ca-apply-reacts reacts.u.u.reply reacts.u-reply)
    ?:  =(merged reacts.u.u.reply)  ca-core
    (put-reply `u.u.reply(reacts merged) %reacts (uv-reacts:utils merged))
    ::
    ::  put a reply into a post by id
    ::
    ++  put-reply
      |=  [reply=(unit v-reply:c) =r-reply:c]
      ^+  ca-core
      =/  post  (get:on-v-posts:c posts.channel id-post)
      ?~  post  ca-core
      ?~  u.post  ca-core
      =?  recency.remark.channel  ?=(^ reply)
        (max recency.remark.channel id-reply)
      =?  unread-threads.remark.channel
          ?&  ?=(^ reply)
              !=(our.bowl author.u.reply)
              (gth id-reply last-read.remark.channel)
          ==
        (~(put in unread-threads.remark.channel) id-post)
      =.  replies.u.u.post  (put:on-v-replies:c replies.u.u.post id-reply reply)
      =.  posts.channel  (put:on-v-posts:c posts.channel id-post `u.u.post)
      =/  meta=reply-meta:c  (get-reply-meta:utils u.u.post)
      (ca-response %post id-post %reply id-reply meta r-reply)
    --
  ::
  ::  +ca-apply-* functions apply new copies of data to old copies,
  ::  keeping the most recent versions of each sub-piece of data
  ::
  ++  ca-apply-unit-post
    |=  [=id-post:c old=(unit v-post:c) new=(unit v-post:c)]
    ^-  (unit v-post:c)
    ?~  old  ~
    ?~  new  ~
    `(ca-apply-post id-post u.old u.new)
  ::
  ++  ca-apply-post
    |=  [=id-post:c old=v-post:c new=v-post:c]
    ^-  v-post:c
    %_  old
      replies  (ca-apply-replies replies.old replies.new)
      reacts   (ca-apply-reacts reacts.old reacts.new)
      +        +:(apply-rev:c +.old +.new)
    ==
  ::
  ++  ca-apply-reacts
    |=  [old=v-reacts:c new=v-reacts:c]
    ^-  v-reacts:c
    %-  (~(uno by old) new)
    |=  [* a=(rev:c (unit react:c)) b=(rev:c (unit react:c))]
    +:(apply-rev:c a b)
  ::
  ++  ca-apply-replies
    |=  [old=v-replies:c new=v-replies:c]
    ((uno:mo-v-replies:c old new) ca-apply-reply)
  ::
  ++  ca-apply-reply
    |=  [=id-reply:c old=(unit v-reply:c) new=(unit v-reply:c)]
    ^-  (unit v-reply:c)
    ?~  old  ~
    ?~  new  ~
    :-  ~
    %=  u.old
      reacts  (ca-apply-reacts reacts.u.old reacts.u.new)
      +      +.u.new
    ==
  ::
  ::  +ca-hark: notification dispatch
  ::
  ::    entry-points are +on-post and +on-reply, who may implement distinct
  ::    notification behavior
  ::
  ++  ca-hark
    |%
    ++  on-post
      |=  [=id-post:c post=v-post:c]
      ^+  ca-core
      ?:  =(author.post our.bowl)
        ca-core
      ::  we want to be notified if we were mentioned in the post
      ::
      ?:  (was-mentioned:utils content.post our.bowl)
        ?.  (want-hark %mention)
          ca-core
        =/  =path
          ?-    -.kind-data.post
            %diary  /note/(rsh 4 (scot %ui id-post))
            %heap   /curio/(rsh 4 (scot %ui id-post))
            %chat   /message/(rsh 4 (scot %ui id-post))
          ==
        =/  cs=(list content:ha)
          ~[[%ship author.post] ' mentioned you: ' (flatten:utils content.post)]
        (emit (pass-hark (ca-spin path cs ~)))
      ::
      ?:  (want-hark %any)
        =/  =path
          ?-    -.kind-data.post
            %diary  /note/(rsh 4 (scot %ui id-post))
            %heap   /curio/(rsh 4 (scot %ui id-post))
            %chat   /message/(rsh 4 (scot %ui id-post))
          ==
        =/  cs=(list content:ha)
          ~[[%ship author.post] ' sent a message: ' (flatten:utils content.post)]
        (emit (pass-hark (ca-spin path cs ~)))
      ca-core
    ::
    ++  on-reply
      |=  [=id-post:c post=v-post:c reply=v-reply:c]
      ^+  ca-core
      ?:  =(author.reply our.bowl)
        ca-core
      ::  preparation of common cases
      ::
      =*  diary-notification
        :~  [%ship author.reply]  ' commented on '
            [%emph title.kind-data.post]   ': '
            [%ship author.reply]  ': '
            (flatten:utils content.reply)
        ==
      =*  heap-notification
        =/  content  (flatten:utils content.reply)
        =/  title=@t
          ?^  title.kind-data.post  (need title.kind-data.post)
          ?:  (lte (met 3 content) 80)  content
          (cat 3 (end [3 77] content) '...')
        :~  [%ship author.reply]  ' commented on '
            [%emph title]   ': '
            [%ship author.reply]  ': '
            content
        ==
      ::  construct a notification message based on the reason to notify,
      ::  if we even need to notify at all
      ::
      =;  cs=(unit (list content:ha))
        ?~  cs  ca-core
        =/  =path
          ?-    -.kind-data.post
            %diary  /note/(rsh 4 (scot %ui id-post))/(rsh 4 (scot %ui id.reply))
            %heap   /curio/(rsh 4 (scot %ui id-post))/(rsh 4 (scot %ui id.reply))
            %chat   /message/(rsh 4 (scot %ui id-post))/(rsh 4 (scot %ui id.reply))
          ==
        (emit (pass-hark (ca-spin path u.cs ~)))
      ::  notify because we wrote the post the reply responds to
      ::
      ?:  =(author.post our.bowl)
        ?.  (want-hark %ours)  ~
        ?-    -.kind-data.post
            %diary  `diary-notification
            %heap   `heap-notification
            %chat
          :-  ~
          :~  [%ship author.reply]
              ' replied to you: '
              (flatten:utils content.reply)
          ==
        ==
      ::  notify because we were mentioned in the reply
      ::
      ?:  (was-mentioned:utils content.reply our.bowl)
        ?.  (want-hark %mention)  ~
        `~[[%ship author.reply] ' mentioned you: ' (flatten:utils content.reply)]
      ::  notify because we ourselves responded to this post previously
      ::
      ?:  %+  lien  (tap:on-v-replies:c replies.post)
          |=  [=time reply=(unit v-reply:c)]
          ?~  reply  |
          =(author.u.reply our.bowl)
        ?.  (want-hark %ours)  ~
        ?-    -.kind-data.post
            %diary  `diary-notification
            %heap   `heap-notification
            %chat
          :-  ~
          :~  [%ship author.reply]
              ' replied to your message “'
              (flatten:utils content.post)
              '”: '
              [%ship author.reply]
              ': '
              (flatten:utils content.reply)
          ==
        ==
      ::  only notify if we want to be notified about everything
      ::
      ?.  (want-hark %any)
        ~
      ?-    -.kind-data.post
          %diary  ~
          %heap   ~
          %chat
        :-  ~
        :~  [%ship author.reply]
            ' sent a message: '
            (flatten:utils content.reply)
        ==
      ==
    ::
    ++  want-hark
      |=  kind=?(%mention %ours %any)
      %+  (fit-level:volume [our now]:bowl)
        [%channel nest]
      ?-  kind
        %mention  %soft  ::  mentioned us
        %ours     %soft  ::  replied to us or our context
        %any      %loud  ::  any message
      ==
    --
  ::
  ::  convert content into a full yarn suitable for hark
  ::
  ++  ca-spin
    |=  [rest=path con=(list content:ha) but=(unit button:ha)]
    ^-  new-yarn:ha
    =*  group  group.perm.perm.channel
    =/  gn=nest:g  nest
    =/  thread  (welp /[kind.nest]/(scot %p ship.nest)/[name.nest] rest)
    =/  rope  [`group `gn q.byk.bowl thread]
    =/  link  (welp /groups/(scot %p p.group)/[q.group]/channels thread)
    [& & rope con link but]
  ::
  ::  give a "response" to our subscribers
  ::
  ++  ca-response
    |=  =r-channel:c
    =/  =r-channels:c  [nest r-channel]
    (give %fact ~[/ ca-area] channel-response+!>(r-channels))
  ::
  ::  produce an up-to-date unread state
  ::
  ++  ca-unread
    ^-  unread:c
    :-  recency.remark.channel
    =/  unreads
      %+  skim
        %-  bap:on-v-posts:c
        (lot:on-v-posts:c posts.channel `last-read.remark.channel ~)
      |=  [tim=time post=(unit v-post:c)]
      ?&  ?=(^ post)
          !=(author.u.post our.bowl)
      ==
    =/  count  (lent unreads)
    =/  unread=(unit [id-post:c @ud])
      ::TODO  in the ~ case, we could traverse further up, to better handle
      ::      cases where the most recent message was deleted.
      ?~  unreads  ~
      (some -:(rear unreads) count)
    ::  now do the same for all unread threads
    ::
    =/  [sum=@ud threads=(map id-post:c [id-reply:c @ud])]
      %+  roll  ~(tap in unread-threads.remark.channel)
      |=  [id=id-post:c sum=@ud threads=(map id-post:c [id-reply:c @ud])]
      =/  parent    (get:on-v-posts:c posts.channel id)
      ?~  parent    [sum threads]
      ?~  u.parent  [sum threads]
      =/  unreads
        %+  skim
          %-  bap:on-v-replies:c
          (lot:on-v-replies:c replies.u.u.parent `last-read.remark.channel ~)
        |=  [tim=time reply=(unit v-reply:c)]
        ?&  ?=(^ reply)
            !=(author.u.reply our.bowl)
        ==
      =/  count=@ud  (lent unreads)
      :-  (add sum count)
      ?~  unreads  threads
      (~(put by threads) id -:(rear unreads) count)
    [(add count sum) unread threads]
  ::
  ::  handle scries
  ::
  ++  ca-peek
    |=  =(pole knot)
    ^-  (unit (unit cage))
    ?+    pole  [~ ~]
        [%posts rest=*]  (ca-peek-posts rest.pole)
        [%perm ~]        ``channel-perm+!>(perm.perm.channel)
        [%search %text skip=@ count=@ nedl=@ ~]
      :^  ~  ~  %channel-scan  !>
      %^    text:ca-search
          (slav %ud skip.pole)
        (slav %ud count.pole)
      nedl.pole
    ::
        [%search %mention skip=@ count=@ nedl=@ ~]
      :^  ~  ~  %channel-scan  !>
      %^    mention:ca-search
          (slav %ud skip.pole)
        (slav %ud count.pole)
      (slav %p nedl.pole)
    ==
  ::
  ++  give-posts
    |=  [mode=?(%outline %post) ls=(list [time (unit v-post:c)])]
    ^-  (unit (unit cage))
    =/  posts=v-posts:c  (gas:on-v-posts:c *v-posts:c ls)
    =;  =paged-posts:c
      ``channel-posts+!>(paged-posts)
    ?:  =(0 (lent ls))  [*posts:c ~ ~ 0]
    =/  =posts:c
      ?:  =(%post mode)  (uv-posts:utils posts)
      (uv-posts-without-replies:utils posts)
    =/  newer=(unit time)
      =/  more  (tab:on-v-posts:c posts.channel `-:(rear ls) 1)
      ?~(more ~ `-:(head more))
    =/  older=(unit time)
      =/  more  (bat:mo-v-posts:c posts.channel `-:(head ls) 1)
      ?~(more ~ `-:(head more))
    :*  posts
        newer
        older
        (wyt:on-v-posts:c posts.channel)
    ==
  ::
  ++  ca-peek-posts
    |=  =(pole knot)
    ^-  (unit (unit cage))
    =*  on   on-v-posts:c
    ?+    pole  [~ ~]
        [%newest count=@ mode=?(%outline %post) ~]
      =/  count  (slav %ud count.pole)
      =/  ls     (top:mo-v-posts:c posts.channel count)
      (give-posts mode.pole ls)
    ::
        [%older start=@ count=@ mode=?(%outline %post) ~]
      =/  count  (slav %ud count.pole)
      =/  start  (slav %ud start.pole)
      =/  ls     (bat:mo-v-posts:c posts.channel `start count)
      (give-posts mode.pole ls)
    ::
        [%newer start=@ count=@ mode=?(%outline %post) ~]
      =/  count  (slav %ud count.pole)
      =/  start  (slav %ud start.pole)
      =/  ls     (tab:on posts.channel `start count)
      (give-posts mode.pole ls)
    ::
        [%around time=@ count=@ mode=?(%outline %post) ~]
      =/  count  (slav %ud count.pole)
      =/  time  (slav %ud time.pole)
      =/  older  (bat:mo-v-posts:c posts.channel `time count)
      =/  newer  (tab:on posts.channel `time count)
      =/  post   (get:on posts.channel time)
      =/  posts
          ?~  post  (welp older newer)
          (welp (snoc older [time u.post]) newer)
      (give-posts mode.pole posts)
    ::
        [%post time=@ ~]
      =/  time  (slav %ud time.pole)
      =/  post  (get:on posts.channel time)
      ?~  post  ~
      ?~  u.post  `~
      ``channel-post+!>((uv-post:utils u.u.post))
    ::
        [%post %id time=@ %replies rest=*]
      =/  time  (slav %ud time.pole)
      =/  post  (get:on posts.channel `@da`time)
      ?~  post  ~
      ?~  u.post  `~
      (ca-peek-replies replies.u.u.post rest.pole)
    ==
  ::
  ++  ca-peek-replies
    |=  [replies=v-replies:c =(pole knot)]
    ^-  (unit (unit cage))
    =*  on   on-v-replies:c
    ?+    pole  [~ ~]
        [%all ~]  ``channel-replies+!>(replies)
        [%newest count=@ ~]
      =/  count  (slav %ud count.pole)
      ``channel-replies+!>((gas:on *v-replies:c (top:mo-v-replies:c replies count)))
    ::
        [%older start=@ count=@ ~]
      =/  count  (slav %ud count.pole)
      =/  start  (slav %ud start.pole)
      ``channel-replies+!>((gas:on *v-replies:c (bat:mo-v-replies:c replies `start count)))
    ::
        [%newer start=@ count=@ ~]
      =/  count  (slav %ud count.pole)
      =/  start  (slav %ud start.pole)
      ``channel-replies+!>((gas:on *v-replies:c (tab:on replies `start count)))
    ::
        [%reply %id time=@ ~]
      =/  time  (slav %ud time.pole)
      =/  reply  (get:on-v-replies:c replies `@da`time)
      ?~  reply  ~
      ?~  u.reply  `~
      ``channel-reply+!>(u.u.reply)
    ==
  ::
  ++  ca-search
    |^  |%
        ++  mention
          |=  [sip=@ud len=@ud nedl=ship]
          ^-  scan:c
          (scour sip len %mention nedl)
        ::
        ++  text
          |=  [sip=@ud len=@ud nedl=@t]
          ^-  scan:c
          (scour sip len %text nedl)
        --
    ::
    +$  match-type
      $%  [%mention nedl=ship]
          [%text nedl=@t]
      ==
    ::
    ++  scour
      |=  [skip=@ud len=@ud =match-type]
      =*  posts  posts.channel
      ?>  (gth len 0)
      =+  s=[skip=skip len=len *=scan:c]
      =-  (flop scan)
      |-  ^+  s
      ?~  posts  s
      ?:  =(0 len.s)  s
      =.  s  $(posts r.posts)
      ?:  =(0 len.s)  s
      ::
      =.  s
        ?~  val.n.posts  s
        ?.  (match u.val.n.posts match-type)  s
        ?:  (gth skip.s 0)
          s(skip (dec skip.s))
        =/  res  [%post (uv-post-without-replies:utils u.val.n.posts)]
        s(len (dec len.s), scan [res scan.s])
      ::
      =.  s
        ?~  val.n.posts  s
        (scour-replys s id.u.val.n.posts replies.u.val.n.posts match-type)
      ::
      $(posts l.posts)
    ::
    ++  scour-replys
      |=  [s=[skip=@ud len=@ud =scan:c] =id-post:c replies=v-replies:c =match-type]
      |-  ^+  s
      ?~  replies  s
      ?:  =(0 len.s)  s
      =.  s  $(replies r.replies)
      ?:  =(0 len.s)  s
      ::
      =.  s
        ?~  val.n.replies  s
        ?.  (match-reply u.val.n.replies match-type)  s
        ?:  (gth skip.s 0)
          s(skip (dec skip.s))
        =/  res  [%reply id-post (uv-reply:utils id-post u.val.n.replies)]
        s(len (dec len.s), scan [res scan.s])
      ::
      $(replies l.replies)
    ::
    ++  match
      |=  [post=v-post:c =match-type]
      ^-  ?
      ?-  -.match-type
        %mention  (match-post-mention nedl.match-type post)
        %text     (match-post-text nedl.match-type post)
      ==
    ::
    ++  match-reply
      |=  [reply=v-reply:c =match-type]
      ?-  -.match-type
        %mention  (match-story-mention nedl.match-type content.reply)
        %text     (match-story-text nedl.match-type content.reply)
      ==
    ::
    ++  match-post-mention
      |=  [nedl=ship post=v-post:c]
      ^-  ?
      ?:  ?=([%chat %notice ~] kind-data.post)  |
      (match-story-mention nedl content.post)
    ::
    ++  match-story-mention
      |=  [nedl=ship =story:c]
      %+  lien  story
      |=  =verse:c
      ?.  ?=(%inline -.verse)  |
      %+  lien  p.verse
      |=  =inline:c
      ?+  -.inline  |
        %ship                                  =(nedl p.inline)
        ?(%bold %italics %strike %blockquote)  ^$(p.verse p.inline)
      ==
    ::
    ++  match-post-text
      |=  [nedl=@t post=v-post:c]
      ^-  ?
      ?-    -.kind-data.post
          %diary
        (match-story-text nedl ~[%inline title.kind-data.post] content.post)
      ::
          %heap
        %+  match-story-text  nedl
        ?~  title.kind-data.post
          content.post
        [~[%inline u.title.kind-data.post] content.post]
      ::
          %chat
        ?:  =([%notice ~] kind.kind-data.post)  |
        (match-story-text nedl content.post)
      ==
    ::
    ++  match-story-text
      |=  [nedl=@t =story:c]
      %+  lien  story
      |=  =verse:c
      ?.  ?=(%inline -.verse)  |
      %+  lien  p.verse
      |=  =inline:c
      ?@  inline
        (find nedl inline |)
      ?.  ?=(?(%bold %italics %strike %blockquote) -.inline)  |
      ^$(p.verse p.inline)
    ::
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
    ::
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
  ::
  ::  when we receive an update from the group we're in, check if we
  ::  need to change anything
  ::
  ++  ca-recheck
    |=  sects=(set sect:g)
    ::  if our read permissions restored, re-subscribe
    ?:  (can-read:ca-perms our.bowl)  ca-safe-sub
    ca-core
  ::
  ::  assorted helpers
  ::
  ++  ca-from-host  |(=(ship.nest src.bowl) =(p.group.perm.perm.channel src.bowl))
  ::
  ::  leave the subscription only
  ::
  ++  ca-simple-leave
    (emit %pass ca-sub-wire %agent [ship.nest server] %leave ~)
  ::
  ::  Leave the subscription, tell people about it, and delete our local
  ::  state for the channel
  ::
  ++  ca-leave
    =.  ca-core  ca-simple-leave
    =.  ca-core  (ca-response %leave ~)
    =.  gone  &
    ca-core
  --
--
