import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSystem } from '../state/SystemContext';
import GodModePullCord from './GodModePullCord';
import MasterClock from './MasterClock';
import ReadoutNavigator from './ReadoutNavigator';
import ConduitSlider from './ConduitSlider';
import AssetIntakeSlot from './AssetIntakeSlot';
import LatentTray from './LatentTray';
import InboxPanel from './InboxPanel';
import MembersPanel from './MembersPanel';
import CommentPanel from './CommentPanel';

function AnalogConsole({
  activeNode,
  onNodeSelect,
  onNodeLongPress,
  onClaimNode,
  onBroadcast,
  onIntake,
  isBroadcasting,
  latentNodes = [],
  saturnMoons,
  onMoonSync,
  onPowerDown
}) {
  const { isProtected, unreadCount, members, unreadCommentCount } = useSystem();
  const [showInbox,    setShowInbox]    = useState(false);
  const [showMembers,  setShowMembers]  = useState(false);
  const [showComments, setShowComments] = useState(false);

  return (
    <div className={`analog-console ${isProtected ? 'protected' : 'create'}`}>

      {/* LEFT ZONE — Power / Pull Cord */}
      <div className="console-left">
        <span className="console-zone-label">POWER</span>
        <GodModePullCord onPowerDown={onPowerDown} />
      </div>

      <div className="console-zone-divider" />

      {/* CENTER ZONE — Navigation / Systems */}
      <div className="console-center">
        <span className="console-zone-label">NAVIGATION · SYSTEMS</span>
        <MasterClock />
        <div className="console-pit">
          <ReadoutNavigator
            activeNode={activeNode}
            onNodeSelect={onNodeSelect}
            onNodeLongPress={onNodeLongPress}
          />
        </div>
      </div>

      <div className="console-zone-divider" />

      {/* RIGHT ZONE — Comms */}
      <div className="console-right">
        <span className="console-zone-label">COMMS</span>
        <ConduitSlider onBroadcast={onBroadcast} isBroadcasting={isBroadcasting} />

        {/* Asset Intake Slot with panel badges */}
        <div className="console-intake-wrapper">
          <AssetIntakeSlot onIntake={onIntake} />

          {/* Inbox badge — D sees approved_L queue */}
          {unreadCount > 0 && (
            <button
              className="inbox-badge-btn"
              onClick={() => setShowInbox(true)}
              aria-label={`${unreadCount} submission${unreadCount > 1 ? 's' : ''} awaiting review`}
            >
              {unreadCount}
            </button>
          )}

          {/* Collective badge — always shows member count */}
          <button
            className="inbox-badge-btn members-badge-btn"
            onClick={() => setShowMembers(true)}
            aria-label={`${members.length} collective member${members.length !== 1 ? 's' : ''}`}
          >
            ◎ {members.length}
          </button>

          {/* Comments badge */}
          {unreadCommentCount > 0 && (
            <button
              className="inbox-badge-btn comment-badge-btn"
              onClick={() => setShowComments(true)}
              aria-label={`${unreadCommentCount} new transmission${unreadCommentCount > 1 ? 's' : ''}`}
            >
              ◌ {unreadCommentCount}
            </button>
          )}
        </div>

        {latentNodes.length > 0 && (
          <LatentTray latentNodes={latentNodes} onClaimNode={onClaimNode} />
        )}
      </div>

      {/* Slide-in panels */}
      <AnimatePresence>
        {showInbox    && <InboxPanel    viewer="D" onClose={() => setShowInbox(false)} />}
        {showMembers  && <MembersPanel  viewer="D" onClose={() => setShowMembers(false)} />}
        {showComments && <CommentPanel  viewer="D" onClose={() => setShowComments(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default AnalogConsole;
