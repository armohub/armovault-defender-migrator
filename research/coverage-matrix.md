# Coverage matrix

Generated from the knowledge base by `scripts/gen-research.mjs`. Do not edit by hand.

Maps each knowledge object to its stage, workstream, applicability questions, provenance, validation status, sources and open gaps. Knowledge base **2026.10.26** (reviewed 2026-10-19).

Legend. Provenance: **official** = derived from current Microsoft Learn documentation; **practice** = practical guidance from the makers, not a Microsoft requirement. Validation: **docs-verified** = consistent with the cited current pages; **needs-review** = Microsoft sources conflict or are ambiguous (the gap is shown in the app).

**Totals:** 110 items · 103 official · 7 practice · 13 needs-review · 33 snippets · 35 questions.

## By workstream

| Stage | Workstream | Items | Official | Practice | Needs review |
|---|---|---|---|---|---|
| Prepare | Scope, governance and timeline | 5 | 4 | 1 | 0 |
| Prepare | Workspaces and tenants | 6 | 6 | 0 | 1 |
| Prepare | Access and permissions | 6 | 6 | 0 | 2 |
| Prepare | Data governance, compliance and cost | 5 | 4 | 1 | 2 |
| Prepare | Data connectors and ingestion | 8 | 8 | 0 | 1 |
| Prepare | Analytics rules, correlation and incidents | 8 | 8 | 0 | 2 |
| Prepare | Automation rules and playbooks | 6 | 6 | 0 | 0 |
| Prepare | Integrations and APIs | 3 | 3 | 0 | 1 |
| Prepare | Hunting, workbooks, threat intelligence and content | 7 | 7 | 0 | 1 |
| Prepare | SOC operations and training | 4 | 3 | 1 | 0 |
| Prepare | Planning, backup and rollback | 5 | 4 | 1 | 2 |
| Test | Setting up the test | 3 | 2 | 1 | 1 |
| Test | Running the tests | 7 | 7 | 0 | 0 |
| Test | Test outcome | 1 | 1 | 0 | 0 |
| Transition | Checks before the change | 9 | 9 | 0 | 0 |
| Transition | The change | 2 | 2 | 0 | 0 |
| Transition | Checks after the change | 6 | 5 | 1 | 0 |
| Validate | Platform and access | 4 | 4 | 0 | 0 |
| Validate | Data | 1 | 1 | 0 | 0 |
| Validate | Detections and incidents | 3 | 3 | 0 | 0 |
| Validate | Automation | 2 | 2 | 0 | 0 |
| Validate | Integrations | 2 | 2 | 0 | 0 |
| Validate | Content | 3 | 3 | 0 | 0 |
| Validate | Operations | 2 | 2 | 0 | 0 |
| Validate | Closure | 2 | 1 | 1 | 0 |

## Item matrix

| Item | Stage / workstream | Criticality | Applies when (questions) | Provenance | Validation | Sources | Open gap |
|---|---|---|---|---|---|---|---|
| **PREP-SCOPE-01** Agree what the transition changes, and what it does not | Prepare / Scope, governance and timeline | high | always | official | docs-verified | `defportal` `overview` `move` `isoc` |  |
| **PREP-SCOPE-02** Name owners, approvers and the change process | Prepare / Scope, governance and timeline | high | always | practice | docs-verified | `move` `mssp` |  |
| **PREP-SCOPE-03** Set the transition window well before 31 March 2027 | Prepare / Scope, governance and timeline | critical | always | official | docs-verified | `defportal` `overview` `whatsnew` `bestpractices` |  |
| **PREP-SCOPE-04** Check whether any workspace is already connected to the Defender portal | Prepare / Scope, governance and timeline | critical | always | official | docs-verified | `overview` `onboard` `quickstart` |  |
| **PREP-SCOPE-05** Confirm cloud-specific availability and limitations | Prepare / Scope, governance and timeline | high | sovereign_cloud | official | docs-verified | `ah` `residency` `whatsnew` |  |
| **PREP-TOP-01** Inventory all Sentinel-enabled workspaces | Prepare / Workspaces and tenants | critical | always | official | docs-verified | `multiws` `argtypes` `roles` `quickstart` |  |
| **PREP-TOP-02** Decide which workspace will be primary | Prepare / Workspaces and tenants | critical | multi_workspace | official | docs-verified | `multiws` `onboard` `lakeonboard` `correlation` `limits` `crossws` `comparerules` `customfunctions` `prepmultiws` |  |
| **PREP-TOP-03** Find content that depends on standalone Microsoft connectors in secondary workspaces | Prepare / Workspaces and tenants | high | multi_workspace, standalone_connectors | official | docs-verified | `move` `multiws` `schemadiff` `configconnector` `xdrconnector` `exportrules` |  |
| **PREP-TOP-04** Plan to move automation rules to the workspace that will receive Defender XDR incidents | Prepare / Workspaces and tenants | high | multi_workspace, automation_rules | official | docs-verified | `automation` `multiws` `exportauto` `autorules` |  |
| **PREP-TOP-05** Define the multi-tenant access model | Prepare / Workspaces and tenants | high | multi_tenant | official | needs-review | `mto` `mtoreq` `govrel` `onboard` `move` `urbac` `urbacactivate` `overview` `mssp` | Microsoft pages conflict on GDAP (as of 2026-10-19). The onboarding page and the MTO requirements say "not supported". The transition guide says "in preview". Two unified RBAC pages say "supported in unified RBAC" and "not supported in unified RBAC". Treat GDAP support as unresolved. |
| **PREP-TOP-06** Replace workspace manager | Prepare / Workspaces and tenants | high | workspace_manager | official | docs-verified | `move` `defportal` `wsmgr` `xdrwhatsnew` `cicd` |  |
| **PREP-ACC-01** Confirm the person who will connect the workspace has the required roles | Prepare / Access and permissions | critical | always | official | docs-verified | `onboard` `multiws` `urbacmap` |  |
| **PREP-ACC-02** Map analyst roles for working in the Defender portal | Prepare / Access and permissions | high | always | official | docs-verified | `xdrroles` `onboard` `ah` `runplaybooks` `roles` `multiws` |  |
| **PREP-ACC-03** Decide whether and when to use Defender unified RBAC for Sentinel | Prepare / Access and permissions | high | always | official | needs-review | `urbac` `urbacmap` `urbacactivate` `scoping` `multiws` | No Microsoft page fetched on 2026-10-19 explicitly labels unified RBAC for Sentinel as generally available or preview. |
| **PREP-ACC-04** Assess table-level and resource-context access restrictions | Prepare / Access and permissions | high | granular_rbac | official | needs-review | `move` `scoping` `resourcectx` | How table-level RBAC behaves for tables other than IdentityInfo, and how resource-context RBAC behaves in the Defender portal, is not documented. Validate it with a restricted test user. |
| **PREP-ACC-05** Protect the role assignments that the connection creates | Prepare / Access and permissions | medium | always | official | docs-verified | `move` `urbac` `lakeonboard` |  |
| **PREP-ACC-06** List service principals and managed identities with Sentinel roles | Prepare / Access and permissions | medium | sp_roles | official | docs-verified | `urbac` `urbacactivate` |  |
| **PREP-GOV-01** Understand which data policies apply in the Defender portal | Prepare / Data governance, compliance and cost | high | always | official | docs-verified | `move` `residency` `xdrprivacy` `ahoverview` |  |
| **PREP-GOV-02** Obtain compliance sign-off for data storage and processing | Prepare / Data governance, compliance and cost | critical | data_residency | practice | docs-verified | `move` `xdrprivacy` `residency` |  |
| **PREP-GOV-03** Assess customer-managed key (CMK) implications | Prepare / Data governance, compliance and cost | critical | cmk | official | needs-review | `move` `cmk` `lakeonboard` | Microsoft's transition guide and CMK page describe alerts and incidents differently. Both indicate that alerts and incidents are not protected by your keys after the transition. Confirm with Microsoft if this matters for compliance. |
| **PREP-GOV-04** Decide separately whether to onboard the Sentinel data lake | Prepare / Data governance, compliance and cost | medium | data_lake | official | needs-review | `lakeonboard` `billing` `lake` `whatsnew` | What's new (September 2026) says customers onboarding after 23 September 2026 enable the lake tier through Table management, and that retention "evolves" to data lake retention after Sentinel onboarding. It is unclear how this applies to existing customers who connect later. If cost predictability matters, confirm before connecting. |
| **PREP-GOV-05** Confirm cost and retention expectations | Prepare / Data governance, compliance and cost | medium | always | official | docs-verified | `move` `xdrint` `defportal` `billing` `tiers` |  |
| **PREP-CON-01** Review the Microsoft Defender XDR connector configuration | Prepare / Data connectors and ingestion | critical | defender_xdr | official | docs-verified | `xdrint` `xdrconnector` `move` `multiws` `schemadiff` |  |
| **PREP-CON-02** Choose the Defender for Cloud connector approach to avoid duplicate or empty incidents | Prepare / Data connectors and ingestion | high | mdc | official | needs-review | `onboard` `mdcxdr` `mdcincidents` `mdcalerts` `move` `createincidents` `fusionconfig` `exportrules` | No current Microsoft page fetched on 2026-10-19 documents a UI path to "opt out" of Defender for Cloud incident sync into Defender XDR. Treat older guidance that describes an opt-out as possibly outdated. |
| **PREP-CON-03** Plan the Insider Risk Management connector placement | Prepare / Data connectors and ingestion | high | irm | official | docs-verified | `onboard` |  |
| **PREP-CON-04** Capture an ingestion baseline | Prepare / Data connectors and ingestion | critical | always | official | docs-verified | `usage` `union` `move` `wsinsights` `costusage` `connectorhealth` `azworkbooks` |  |
| **PREP-CON-05** Capture an alert and incident baseline | Prepare / Data connectors and ingestion | high | always | official | docs-verified | `move` `schemadiff` `securityincidenttable` `triageincidents` `ruleinsights` |  |
| **PREP-CON-06** Turn on auditing and health monitoring | Prepare / Data connectors and ingestion | high | always | official | docs-verified | `enablehealth` `healthaudit` `connectorhealth` `ruleinsights` `rulehealth` |  |
| **PREP-CON-07** Review content affected by alert schema differences | Prepare / Data connectors and ingestion | medium | standalone_connectors | official | docs-verified | `schemadiff` `exportrules` `hunting` |  |
| **PREP-CON-08** Review which Defender XDR tables you stream into Sentinel | Prepare / Data connectors and ingestion | medium | defender_xdr | official | docs-verified | `ah` `defportal` `retention` `xdrconnector` `billing` `usage` |  |
| **PREP-DET-01** Inventory and export analytics rules | Prepare / Analytics rules, correlation and incidents | critical | always | official | docs-verified | `exportrules` `sialertrules` `siversions` `move` `azcli` `createrules` |  |
| **PREP-DET-02** Plan for the Fusion rule being disabled | Prepare / Analytics rules, correlation and incidents | high | fusion | official | needs-review | `move` `fusion` `corrsettings` | The transition guide says the Defender XDR engine "fully controls" grouping, while the newer correlation settings page describes tenant-level exclusion by default. Read your tenant's actual setting after connection. |
| **PREP-DET-03** Replace Microsoft security incident creation rules | Prepare / Analytics rules, correlation and incidents | critical | ms_incident_rules | official | docs-verified | `move` `xdrint` `migrategrouping` `createincidents` `fusionconfig` |  |
| **PREP-DET-04** Decide what to do with alert-only analytics rules | Prepare / Analytics rules, correlation and incidents | high | alert_only_rules | official | docs-verified | `move` `createrules` `autorules` `comparerules` `fusionconfig` `exportrules` |  |
| **PREP-DET-05** Decide on incident correlation, grouping and titles | Prepare / Analytics rules, correlation and incidents | high | always | official | needs-review | `corrsettings` `move` `createrules` `automation` `correlation` `fusionconfig` `exportrules` | Microsoft pages describe correlation differently. The transition guide says the engine "fully controls" grouping; the correlation settings page says analytics rules are excluded by default. Verify the setting in your tenant. |
| **PREP-DET-06** Review sources of duplicate alerts | Prepare / Analytics rules, correlation and incidents | medium | always | official | docs-verified | `move` `investigatealerts` `exportrules` |  |
| **PREP-DET-07** Capture an analytics rule health baseline | Prepare / Analytics rules, correlation and incidents | medium | always | official | docs-verified | `rulehealth` `ruleinsights` `azworkbooks` |  |
| **PREP-DET-08** Decide whether to defer detection modernisation (custom detections) | Prepare / Analytics rules, correlation and incidents | low | defender_xdr | official | docs-verified | `move` `customfunctions` `customdet` `multiws` `defportal` `comparerules` |  |
| **PREP-AUT-01** Find automation rules whose conditions change after connection | Prepare / Automation rules and playbooks | critical | automation_rules | official | docs-verified | `automation` `siautomation` `autoref` `exportauto` `xdrint` `autorules` |  |
| **PREP-AUT-02** Review alert-trigger automation and the Enhanced Alert Trigger | Prepare / Automation rules and playbooks | medium | automation_rules | official | docs-verified | `automation` `genplaybook` `autorules` |  |
| **PREP-AUT-03** Inventory playbooks and find unsupported actions | Prepare / Automation rules and playbooks | high | playbooks | official | docs-verified | `move` `automation` `runplaybooks` `playbooks` `createrules` `createplaybooks` `autorules` |  |
| **PREP-AUT-04** Plan a long-term replacement for manual playbook runs on alerts and entities | Prepare / Automation rules and playbooks | medium | playbooks, manual_playbooks | official | docs-verified | `runplaybooks` `move` `defportal` |  |
| **PREP-AUT-05** Check that automation timing assumptions still hold | Prepare / Automation rules and playbooks | medium | automation_rules, playbooks, itsm | official | docs-verified | `automation` `move` |  |
| **PREP-AUT-06** Capture an automation health baseline | Prepare / Automation rules and playbooks | medium | automation_rules, playbooks | official | docs-verified | `autohealth` `workbooks` `azworkbooks` `larunhistory` |  |
| **PREP-INT-01** Assess the impact on ticketing (ITSM) and SOAR integrations | Prepare / Integrations and APIs | high | itsm | official | docs-verified | `automation` `move` `siincident` `graphincident` |  |
| **PREP-INT-02** Assess scripts and tools that read incidents and alerts | Prepare / Integrations and APIs | high | api_consumers | official | needs-review | `move` `siincident` `graphincident` `graphlistincidents` `graphalerts` `graphhunting` `securityincidenttable` | The transition guide's field table mixes the Sentinel and Graph APIs (alertProductNames with ?$expand=alerts). In the Sentinel API, alertProductNames is under additionalData; Graph incidents do not have it. |
| **PREP-INT-03** Replace manual, API or playbook-created incidents | Prepare / Integrations and APIs | medium | manual_incidents | official | docs-verified | `move` `manualincidents` `graphincident` |  |
| **PREP-CNT-01** Review workbooks for Defender portal limitations | Prepare / Hunting, workbooks, threat intelligence and content | medium | workbooks | official | docs-verified | `move` `workbooks` `multiws` `ti` `azworkbooks` |  |
| **PREP-CNT-02** Update Defender-side queries that use IdentityInfo | Prepare / Hunting, workbooks, threat intelligence and content | medium | identityinfo | official | docs-verified | `move` `ueba` |  |
| **PREP-CNT-03** Prepare hunting content, bookmarks, livestream and notebooks | Prepare / Hunting, workbooks, threat intelligence and content | medium | hunting | official | docs-verified | `ah` `hunting` `notebooks` `defportal` `ahoverview` `cicd` `search` |  |
| **PREP-CNT-04** Inventory watchlists | Prepare / Hunting, workbooks, threat intelligence and content | low | watchlists | official | docs-verified | `watchlists` `siwatchlists` `azps` `watchlistedit` |  |
| **PREP-CNT-05** Prepare threat intelligence workflows and content | Prepare / Hunting, workbooks, threat intelligence and content | medium | ti | official | needs-review | `ti` `stix` `move` `addentityti` `titransition` `tiexplorer` `mdtieol` `workti` `exportrules` | Microsoft pages name the TI area differently ("Intel management" vs "Overview / Intel explorer"). The transition guide still describes Intel Profiles and Intel Explorer as "supported for MDTI customers", which conflicts with the MDTI end-of-life announcement. |
| **PREP-CNT-06** Confirm UEBA configuration and entity page changes | Prepare / Hunting, workbooks, threat intelligence and content | low | ueba | official | docs-verified | `move` `enableueba` `entitypages` `ueba` |  |
| **PREP-CNT-07** Check content-as-code pipelines and content hub use | Prepare / Hunting, workbooks, threat intelligence and content | medium | cicd | official | docs-verified | `cicd` `whatsnew` `contenthub` |  |
| **PREP-OPS-01** Update SOC runbooks for Defender portal navigation | Prepare / SOC operations and training | high | always | official | docs-verified | `defportal` `socopt` |  |
| **PREP-OPS-02** Adapt analyst workflows to feature differences | Prepare / SOC operations and training | medium | soc_workflows | official | docs-verified | `move` `tasksdefender` `automation` |  |
| **PREP-OPS-03** Plan analyst training on the Defender portal | Prepare / SOC operations and training | high | always | official | docs-verified | `move` `defportal` |  |
| **PREP-OPS-04** Prepare communications for affected teams | Prepare / SOC operations and training | low | always | practice | docs-verified | `move` |  |
| **PREP-PLN-01** Back up configuration before the change | Prepare / Planning, backup and rollback | critical | always | official | docs-verified | `move` `onboard` `exportrules` `exportauto` `armexport` |  |
| **PREP-PLN-02** Define acceptance criteria for validation | Prepare / Planning, backup and rollback | high | always | practice | docs-verified | `correlation` `migrategrouping` |  |
| **PREP-PLN-03** Prepare the rollback and contingency plan | Prepare / Planning, backup and rollback | critical | always | official | needs-review | `onboard` `offboard` `multiws` `lakeonboard` `defportal` | Microsoft does not document which onboarding changes are reversed by disconnecting. If you have a test environment, rehearse disconnection there and record what you observe (see [[TEST-10\|the disconnection rehearsal]]). |
| **PREP-PLN-04** Decide the test approach | Prepare / Planning, backup and rollback | high | always | official | needs-review | `multiws` `onboard` | This recommendation is derived from documented primary-workspace behaviour. Microsoft does not publish a test-environment strategy for the transition. |
| **PREP-PLN-05** Review Stage 1 readiness and record the gate decision | Prepare / Planning, backup and rollback | critical | always | official | docs-verified | `move` |  |
| **TEST-01** Confirm the test environment is suitable and record its differences | Test / Setting up the test | critical | always | official | needs-review | `multiws` `onboard` | Microsoft does not publish a test-environment strategy for the transition. The same-tenant warning is derived from documented primary-workspace and connector behaviour. |
| **TEST-02** Scope the test plan from Stage 1 findings | Test / Setting up the test | high | always | practice | docs-verified | `migrategrouping` |  |
| **TEST-03** Capture a test baseline | Test / Setting up the test | high | always | official | docs-verified | `usage` `healthtables` `wsinsights` `connectorhealth` `triageincidents` `rulehealth` `autohealth` `workbooks` `azworkbooks` |  |
| **TEST-04** Connect the test workspace to the Defender portal | Test / Running the tests | critical | always | official | docs-verified | `onboard` `migrategrouping` |  |
| **TEST-05** Validate incident creation, correlation and titles | Test / Running the tests | critical | always | official | docs-verified | `migrategrouping` `corrsettings` `move` `incidentqueue` |  |
| **TEST-06** Validate automation rules and playbooks | Test / Running the tests | critical | automation_rules, playbooks | official | docs-verified | `automation` `autohealth` `runplaybooks` `workbooks` `larunhistory` |  |
| **TEST-07** Validate integrations with test endpoints | Test / Running the tests | high | itsm, api_consumers | official | docs-verified | `move` `automation` |  |
| **TEST-08** Validate access and analyst workflows | Test / Running the tests | high | always | official | docs-verified | `onboard` `move` |  |
| **TEST-09** Validate workbooks, hunting and threat intelligence content | Test / Running the tests | medium | workbooks, hunting, identityinfo, ti, watchlists | official | docs-verified | `workbooks` `ah` `titransition` |  |
| **TEST-10** Rehearse disconnection (optional) | Test / Running the tests | medium | always | official | docs-verified | `onboard` `offboard` |  |
| **TEST-11** Record the test outcome and production recommendation | Test / Test outcome | critical | always | official | docs-verified | `migrategrouping` |  |
| **TRN-01** Decide go or no-go: approvals, change record and participants | Transition / Checks before the change | critical | always | official | docs-verified | `move` |  |
| **TRN-02** Confirm Stage 1 blockers are resolved or formally accepted | Transition / Checks before the change | critical | always | official | docs-verified | `move` |  |
| **TRN-03** Refresh the configuration backup | Transition / Checks before the change | critical | always | official | docs-verified | `exportrules` `exportauto` `armexport` |  |
| **TRN-04** Apply automation rule changes that are safe before connecting | Transition / Checks before the change | high | automation_rules | official | docs-verified | `automation` |  |
| **TRN-05** Configure Defender for Cloud connectors as decided | Transition / Checks before the change | high | mdc | official | docs-verified | `onboard` `mdcxdr` `mdcalerts` `configconnector` `fusionconfig` |  |
| **TRN-06** Place the Insider Risk Management connector on the primary only | Transition / Checks before the change | high | irm | official | docs-verified | `onboard` |  |
| **TRN-07** Disconnect other standalone Microsoft alert connectors in secondary workspaces | Transition / Checks before the change | medium | multi_workspace, standalone_connectors | official | docs-verified | `multiws` |  |
| **TRN-08** Verify the operator's roles on the day | Transition / Checks before the change | critical | always | official | docs-verified | `onboard` |  |
| **TRN-09** Capture a pre-change snapshot | Transition / Checks before the change | high | always | official | docs-verified | `usage` `healthtables` `connectorhealth` `triageincidents` `rulehealth` `autohealth` `workbooks` `azworkbooks` |  |
| **TRN-10** Connect the workspace(s) to the Defender portal | Transition / The change | critical | always | official | docs-verified | `onboard` `move` `migrategrouping` `automation` |  |
| **TRN-11** Confirm the connection | Transition / The change | critical | always | official | docs-verified | `onboard` |  |
| **TRN-12** Verify the expected automatic changes | Transition / Checks after the change | high | always | official | docs-verified | `move` `xdrint` `multiws` `fusionconfig` `createincidents` `xdrconnector` |  |
| **TRN-13** Verify incidents flow into the Defender portal | Transition / Checks after the change | critical | always | official | docs-verified | `correlation` `xdrconnector` `automation` `incidentqueue` |  |
| **TRN-14** Apply post-connection configuration | Transition / Checks after the change | high | always | official | docs-verified | `corrsettings` `migrategrouping` `investigatealerts` |  |
| **TRN-15** Apply integration changes | Transition / Checks after the change | high | itsm, api_consumers | official | docs-verified | `move` |  |
| **TRN-16** Run hypercare monitoring | Transition / Checks after the change | high | always | practice | docs-verified | `autohealth` `rulehealth` `workbooks` `azworkbooks` `connectorhealth` `incidentqueue` |  |
| **TRN-17** Record the execution outcome | Transition / Checks after the change | critical | always | official | docs-verified | `onboard` |  |
| **VAL-01** Check the workspaces appear correctly in the Defender portal | Validate / Platform and access | critical | always | official | docs-verified | `multiws` `onboard` |  |
| **VAL-02** Check each persona can do its job | Validate / Platform and access | critical | always | official | docs-verified | `onboard` `runplaybooks` `ah` |  |
| **VAL-03** Check data ingestion matches the baseline | Validate / Data | critical | always | official | docs-verified | `usage` `move` `connectorhealth` `wsinsights` `azworkbooks` |  |
| **VAL-04** Check analytics rules run and produce incidents | Validate / Detections and incidents | critical | always | official | docs-verified | `correlation` `rulehealth` `customdetmanage` `workbooks` `ruleinsights` |  |
| **VAL-05** Check correlation, grouping and titles behave as decided | Validate / Detections and incidents | high | always | official | docs-verified | `corrsettings` `correlation` `migrategrouping` |  |
| **VAL-06** Check automation rules execute as expected | Validate / Automation | critical | automation_rules | official | docs-verified | `automation` `autohealth` `workbooks` `azworkbooks` `investigateincidents` |  |
| **VAL-07** Check playbooks run successfully | Validate / Automation | high | playbooks | official | docs-verified | `runplaybooks` `autohealth` `larunhistory` |  |
| **VAL-08** Check the ticketing integration works end to end | Validate / Integrations | high | itsm | official | docs-verified | `move` `automation` |  |
| **VAL-09** Check API consumers and reports work | Validate / Integrations | high | api_consumers | official | docs-verified | `move` `graphlistincidents` |  |
| **VAL-10** Check for duplicate or empty incidents from Microsoft sources | Validate / Detections and incidents | high | defender_xdr, mdc | official | docs-verified | `mdcincidents` `mdcxdr` `move` `incidentqueue` `investigatealerts` |  |
| **VAL-11** Check key workbooks work | Validate / Content | medium | workbooks | official | docs-verified | `workbooks` `multiws` |  |
| **VAL-12** Check hunting queries and bookmarks work | Validate / Content | medium | hunting, identityinfo | official | docs-verified | `ah` `ueba` |  |
| **VAL-13** Check threat intelligence, watchlists and UEBA work | Validate / Content | medium | ti, watchlists, ueba | official | docs-verified | `ti` `watchlists` `entitypages` `workti` `watchlistedit` |  |
| **VAL-14** Check multi-workspace behaviour is understood and working | Validate / Platform and access | high | multi_workspace | official | docs-verified | `multiws` `automation` |  |
| **VAL-15** Check Microsoft app role assignments and health monitoring are intact | Validate / Platform and access | medium | always | official | docs-verified | `move` `enablehealth` `rulehealth` `ruleinsights` |  |
| **VAL-16** Confirm SOC procedures are updated and analysts are trained | Validate / Operations | high | always | official | docs-verified | `move` |  |
| **VAL-17** Document known limitations with long-term workarounds | Validate / Operations | high | always | official | docs-verified | `move` `defportal` |  |
| **VAL-18** Review residual risks and open actions, then sign off | Validate / Closure | critical | always | official | docs-verified | `move` |  |
| **VAL-19** Schedule a post-transition review | Validate / Closure | medium | always | practice | docs-verified | `move` |  |

## Questions → items

| Question | Items whose applicability depends on it |
|---|---|
| `onboarded_any` Is any Sentinel workspace in this tenant already connected to the Defender portal? | none (context only) |
| `multi_workspace` Is more than one Sentinel-enabled workspace in scope in this tenant? | PREP-TOP-02, PREP-TOP-03, PREP-TOP-04, TRN-07, VAL-14 |
| `multi_tenant` Do you run Sentinel across more than one tenant? | PREP-TOP-05 |
| `sovereign_cloud` Is any in-scope tenant in a government or sovereign cloud? | PREP-SCOPE-05 |
| `defender_xdr` Is Microsoft Defender XDR licensed and in use in this tenant? | PREP-CON-01, PREP-CON-08, PREP-DET-08, VAL-10 |
| `test_env` Do you have a non-production Sentinel environment to test the transition first? | none (context only) |
| `test_separate_tenant` Is that test environment in a separate tenant from production? | none (context only) |
| `data_residency` Do any internal or company policies, or regulations, limit where security data may be stored or processed? | PREP-GOV-02 |
| `cmk` Is any in-scope workspace protected with customer-managed keys? | PREP-GOV-03 |
| `data_lake` Do you use, or plan to onboard, the Microsoft Sentinel data lake? | PREP-GOV-04 |
| `mdc` Do you bring Microsoft Defender for Cloud alerts or incidents into Sentinel? | PREP-CON-02, TRN-05, VAL-10 |
| `standalone_connectors` Do any workspaces use standalone Microsoft product connectors? | PREP-TOP-03, PREP-CON-07, TRN-07 |
| `irm` Do you use the Microsoft 365 Insider Risk Management connector? | PREP-CON-03, TRN-06 |
| `fusion` Is the Fusion (Advanced multistage attack detection) rule enabled? | PREP-DET-02 |
| `ms_incident_rules` Do you use Microsoft security incident creation rules? | PREP-DET-03 |
| `alert_only_rules` Do you have analytics rules with incident creation turned off? | PREP-DET-04 |
| `grouping_dependency` Do processes, automation or reports rely on incident titles, alert grouping or reopened incidents? | none (context only) |
| `manual_incidents` Do you create incidents manually, through the API, or from playbooks? | PREP-INT-03 |
| `automation_rules` Do you use automation rules? | PREP-TOP-04, PREP-AUT-01, PREP-AUT-02, PREP-AUT-05, PREP-AUT-06, TEST-06, TRN-04, VAL-06 |
| `playbooks` Do you use playbooks? | PREP-AUT-03, PREP-AUT-04, PREP-AUT-05, PREP-AUT-06, TEST-06, VAL-07 |
| `manual_playbooks` Do analysts run playbooks manually on alerts or entities? | PREP-AUT-04 |
| `itsm` Are incidents synchronised to a ticketing or SOAR system? | PREP-AUT-05, PREP-INT-01, TEST-07, TRN-15, VAL-08 |
| `api_consumers` Do scripts, reports or tools read your Sentinel incidents? | PREP-INT-02, TEST-07, TRN-15, VAL-09 |
| `cicd` Do you deploy Sentinel content as code? | PREP-CNT-07 |
| `workspace_manager` Do you use Sentinel workspace manager? | PREP-TOP-06 |
| `urbac` Is Microsoft Defender unified RBAC active, or planned, for Sentinel workspaces? | none (context only) |
| `granular_rbac` Do you restrict access with table-level or resource-context RBAC? | PREP-ACC-04 |
| `sp_roles` Do service principals or managed identities hold Sentinel roles? | PREP-ACC-06 |
| `workbooks` Do you use workbooks? | PREP-CNT-01, TEST-09, VAL-11 |
| `identityinfo` Do your Defender portal hunting queries or custom detections use IdentityInfo? | PREP-CNT-02, TEST-09, VAL-12 |
| `hunting` Do analysts use hunting queries, bookmarks, livestream or notebooks? | PREP-CNT-03, TEST-09, VAL-12 |
| `watchlists` Do you use watchlists? | PREP-CNT-04, TEST-09, VAL-13 |
| `ti` Do you use threat intelligence in Sentinel? | PREP-CNT-05, TEST-09, VAL-13 |
| `ueba` Is UEBA enabled? | PREP-CNT-06, VAL-13 |
| `soc_workflows` Do analyst runbooks rely on incident tasks, similar incidents or editing comments? | PREP-OPS-02 |
