package org.subnode.mongo;

import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;
import org.subnode.model.client.NodeProp;
import org.subnode.model.client.PrivilegeType;
import org.subnode.mongo.model.SubNode;
import org.subnode.service.IPFSService;

/**
 * Utilities related to management of the JCR Repository
 */
@Component
public class MongoUpdate {
	private static final Logger log = LoggerFactory.getLogger(MongoUpdate.class);

	@Autowired
	private MongoTemplate ops;

	@Autowired
	private MongoRead read;

	@Autowired
	private IPFSService ipfs;

	@Autowired
	private RunAsMongoAdmin adminRunner;

	@Autowired
	private MongoAuth auth;

	public void save(MongoSession session, SubNode node) {
		save(session, node, true);
	}

	public void save(MongoSession session, SubNode node, boolean allowAuth) {
		if (allowAuth) {
			auth.auth(session, node, PrivilegeType.WRITE);
		}
		// log.debug("MongoApi.save: DATA: " + XString.prettyPrint(node));
		ops.save(node);
		MongoThreadLocal.clean(node);
	}

	public void saveSession(MongoSession session) {
		if (session == null || session.saving || !MongoThreadLocal.hasDirtyNodes())
			return;

		try {
			// we check the saving flag to ensure we don't go into circular recursion here.
			session.saving = true;

			synchronized (session) {
				// recheck hasDirtyNodes again after we get inside the lock.
				if (!MongoThreadLocal.hasDirtyNodes()) {
					return;
				}

				/*
				 * We use 'nodes' list to avoid a concurrent modification excption in the loop
				 * below that deletes nodes, because each time we delete a node we remove it
				 * from the 'dirtyNodes' on the threadlocals
				 */
				List<SubNode> nodes = new LinkedList<SubNode>();

				/*
				 * check that we are allowed to write all, before we start writing any
				 */
				for (SubNode node : MongoThreadLocal.getDirtyNodes().values()) {
					auth.auth(session, node, PrivilegeType.WRITE);
					nodes.add(node);
				}

				for (SubNode node : nodes) {
					// log.debug("saveSession: Saving Dirty. nodeId=" + (node.getId()==null ? "null
					// (new node?)" : node.getId().toHexString()));
					save(session, node, false);
				}

				/*
				 * This theoretically should never find any dirty nodes, because we just saved
				 * them all but we definitely still want this line of code here
				 */
				MongoThreadLocal.clearDirtyNodes();
			}
		} finally {
			session.saving = false;
		}
	}

	/*
	 * Unpins any IPFS data that is not currently referenced by MongoDb. Cleans up
	 * orphans.
	 */
	public void releaseOrphanIPFSPins() {
		adminRunner.run(session -> {
			int pinCount = 0, orphanCount = 0;
			LinkedHashMap<String, Object> pins = ipfs.getPins();
			if (pins != null) {
				for (String pin : pins.keySet()) {
					SubNode ipfsNode = read.findSubNodeByProp(session, NodeProp.IPFS_LINK.s(), pin);
					if (ipfsNode != null) {
						pinCount++;
						// log.debug("Found IPFS CID=" + pin + " on nodeId " +
						// ipfsNode.getId().toHexString());
					} else {
						// log.debug("Removing Orphan IPFS CID=" + pin);
						orphanCount++;
						ipfs.removePin(pin);
					}
				}
			}
			log.debug("Number of IPFS Pins in use: " + pinCount + "\nNumber of orphans removed: " + orphanCount);
		});
	}
}