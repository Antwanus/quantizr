package org.subnode.config;

import java.util.List;

import org.subnode.test.TestIntf;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class TestRunner {
	private static final Logger log = LoggerFactory.getLogger(TestRunner.class);

	@Autowired
	private ApplicationContext context;

	@Autowired
	private AppProp appProp;

	/*
	 * I've removed JUnit (for now) so that we can alway test *only* in a full
	 * environment and inside a docker container. on a *real* setup/instance.
	 */
	public void test() {
		List<String> tests = appProp.getRunTests();

		if (!CollectionUtils.isEmpty(tests)) {
			log.debug("====================================================================");
			tests.forEach(testClass -> {
				try {
					log.debug("RUNNING TEST CLASS: " + testClass);
					TestIntf testInst = (TestIntf) context.getBean(testClass);
					testInst.test();
				} catch (Exception e) {
					log.error("test failed.", e);
				} finally {

				}
			});
			log.debug("Finished running tests.");
			log.debug("====================================================================");
		}
	}
}
