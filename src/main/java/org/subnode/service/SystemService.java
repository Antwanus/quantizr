package org.subnode.service;

import java.util.Map;

import com.mongodb.client.MongoDatabase;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.subnode.config.AppFilter;
import org.subnode.config.AppSessionListener;
import org.subnode.model.IPFSDirStat;
import org.subnode.mongo.MongoUtil;
import org.subnode.mongo.MongoAppConfig;
import org.subnode.mongo.MongoRead;
import org.subnode.mongo.MongoSession;
import org.subnode.mongo.MongoUpdate;
import org.subnode.mongo.RunAsMongoAdmin;
import org.subnode.mongo.model.SubNode;
import org.subnode.util.Const;
import org.subnode.util.ValContainer;
import org.subnode.util.XString;

/**
 * Service methods for System related functions. Admin functions.
 */
@Component
public class SystemService {
	private static final Logger log = LoggerFactory.getLogger(SystemService.class);

	@Autowired
	private MongoAppConfig mac;

	@Autowired
	private MongoUtil util;

	@Autowired
	private MongoRead read;

	@Autowired
	private MongoUpdate update;

	@Autowired
	private RunAsMongoAdmin adminRunner;

	@Autowired
	private ExportJsonService exportJsonService;

	@Autowired
	private AttachmentService attachmentService;

	@Autowired
	private IPFSService ipfsService;

	public String initializeAppContent() {
		ValContainer<String> ret = new ValContainer<String>();

		// todo-0: needs review. I think this capability may no longer be needed.
		adminRunner.run(session -> {
			ret.setVal(exportJsonService.resetNode(session, "public"));
			// ret.setVal(exportJsonService.resetNode(session, "books"));
			ret.setVal(exportJsonService.resetNode(session, "rss"));
		});

		return ret.getVal();
	}

	public String compactDb() {
		attachmentService.gridMaintenanceScan();
		update.releaseOrphanIPFSPins();

		MongoDatabase database = mac.mongoClient().getDatabase(MongoAppConfig.databaseName);
		Document result = database.runCommand(new Document("compact", "nodes"));

		StringBuilder ret = new StringBuilder();
		ret.append("Compact Results:\n");
		for (Map.Entry<String, Object> set : result.entrySet()) {
			ret.append(String.format("%s: %s%n", set.getKey(), set.getValue()));
		}

		return ret.toString();
	}

	public static void logMemory() {
		// Runtime runtime = Runtime.getRuntime();
		// long freeMem = runtime.freeMemory() / ONE_MB;
		// long maxMem = runtime.maxMemory() / ONE_MB;
		// log.info(String.format("GC Cycle. FreeMem=%dMB, MaxMem=%dMB", freeMem,
		// maxMem));
	}

	public String getJson(MongoSession session, String nodeId) {
		SubNode node = read.getNode(session, nodeId, true);
		if (node != null) {
			String ret = XString.prettyPrint(node);

			IPFSDirStat fullStat = ipfsService.pathStat(node.getPath());
			if (fullStat != null) {
				ret += "\n\nIPFS Folder Stats:\n" + XString.prettyPrint(fullStat);
			}

			IPFSDirStat nodeStat = ipfsService.pathStat(node.getPath() + "/node.json");
			if (nodeStat != null) {
				ret += "\n\nIPFS File Stats:\n" + XString.prettyPrint(nodeStat);
			}

			// NOTE: We used to have a "Show IPFS Info" that displayed what comes from
			// this...
			// ipfsService.getNodeInfo(MongoSession session, String nodeId) {

			return ret;
		} else {
			return "node not found!";
		}
	}

	public String getSystemInfo() {
		StringBuilder sb = new StringBuilder();
		Runtime runtime = Runtime.getRuntime();
		runtime.gc();
		long freeMem = runtime.freeMemory() / Const.ONE_MB;
		sb.append(String.format("Server Free Memory: %dMB<br>", freeMem));
		sb.append(String.format("Session Count: %d<br>", AppSessionListener.getSessionCounter()));
		sb.append(getIpReport());
		sb.append("<p>" + util.getNodeReport());
		return sb.toString();
	}

	private static String getIpReport() {
		return "Number of Unique IPs since startup: " + AppFilter.getUniqueIpHits().size();
		// StringBuilder sb = new StringBuilder();
		// sb.append("Unique IPs During Run<br>");
		// int count = 0;
		// HashMap<String, Integer> map = AppFilter.getUniqueIpHits();
		// synchronized (map) {
		// for (String key : map.keySet()) {
		// int hits = map.get(key);
		// sb.append("IP=" + key + " hits=" + hits);
		// sb.append("<br>");
		// count++;
		// }
		// }
		// sb.append("count=" + count + "<br>");
		// return sb.toString();
	}
}
