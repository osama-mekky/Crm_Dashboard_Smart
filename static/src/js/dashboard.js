/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useState, onMounted, onWillUnmount, useRef } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class CrmDashboard extends Component {
    setup() {
        this.rpc = useService("rpc");
        this.actionService = useService("action");

        this.state = useState({
            total: 0,
            won: 0,
            lost: 0,
            in_progress: 0,
            this_month: 0,
            overdue: 0,
            scheduled: 0,
            expected_revenue: 0,
            conversion_rate: 0,
            selected_salesperson: "",
            salespersons: [],
            total_leads: 0,
            new: 0,
            qualified: 0,
            proposal: 0,
            lost_reasons: [],
            theme: localStorage.getItem("crm_theme") || "light",
            comparison: {
                salesperson1: "",
                salesperson2: "",
                result: "",
                stats1: null,
                stats2: null,
            },
            comparisonResult: null,
            bestSalespersonName: "",
        });

        this.leadsPieChartRef = useRef("leadsPieChart");
        this.lostReasonsChartRef = useRef("lostReasonsChart");
        this._chartInstance = null;
        this._lostChartInstance = null;

        onWillStart(async () => {
            const users = await this.rpc("/crm_dashboard/salespersons");
            this.state.salespersons = users;
            await this.fetchAllCounts();
        });

        onMounted(() => {
            this._intervalId = setInterval(this.fetchAllCounts.bind(this), 10000);
            this.renderLeadsPie();
            this.renderLostReasons();
        });

        onWillUnmount(() => {
            clearInterval(this._intervalId);
            if (this._chartInstance) {
                this._chartInstance.destroy();
            }
            if (this._lostChartInstance) {
                this._lostChartInstance.destroy();
            }
        });
    }

    toggleTheme() {
        this.state.theme = this.state.theme === "light" ? "dark" : "light";
        localStorage.setItem("crm_theme", this.state.theme);
    }

    onSalespersonChange(ev) {
    this.state.selected_salesperson = ev.target.value;
    this.fetchAllCounts().then(() => {
        this.renderLeadsPie();
        this.renderLostReasons();  // ✅ add this
    });
    }


    onCompareUser1(ev) {
    this.state.comparison.salesperson1 = ev.target.value;
}

    onCompareUser2(ev) {
    this.state.comparison.salesperson2 = ev.target.value;
}
    async fetchAllCounts() {
        const user_id = this.state.selected_salesperson || null;

        try {
            const results = await Promise.all([
                this.rpc("/crm_dashboard/in_progress_opportunities", { user_id }),
                this.rpc("/crm_dashboard/this_month_opportunities", { user_id }),
                this.rpc("/crm_dashboard/overdue_activities", { user_id }),
                this.rpc("/crm_dashboard/scheduled_activities", { user_id }),
                this.rpc("/crm_dashboard/expected_revenue", { user_id }),
                this.rpc("/crm_dashboard/won_opportunities", { user_id }),
                this.rpc("/crm_dashboard/lost_opportunities", { user_id }),
                this.rpc("/crm_dashboard/conversion_rate", { user_id }),
                this.rpc("/crm_dashboard/total_leads", { user_id }),
                this.rpc("/crm_dashboard/lost_reasons", { user_id }),  // ✅ new line
                this.rpc("/crm_dashboard/new_opportunities", { user_id }), // 🆕
                this.rpc("/crm_dashboard/proposition_count", { user_id }), // 🆕


            ]);

            [
                this.state.in_progress,
                this.state.this_month,
                this.state.overdue,
                this.state.scheduled,
                this.state.expected_revenue,
                this.state.won,
                this.state.lost,
                this.state.conversion_rate,
                this.state.total_leads,
                this.state.lost_reasons,
                this.state.new_stage, // 🆕
                this.state.proposition_stage,

                

            ] = results;
        } catch (e) {
            console.error("Failed to fetch metrics", e);
        }
    }

    async renderLeadsPie() {
        const ctx = this.leadsPieChartRef?.el?.getContext("2d");
        if (!ctx) return;

        if (this._chartInstance) {
            this._chartInstance.destroy();
        }

        try {
            const response = await this.rpc("/crm_dashboard/leads_by_salesperson");
            const { labels, values } = response;

            const dynamicColors = labels.map((_, index) =>
                `hsl(${(index * 360 / labels.length)}, 70%, 50%)`
            );

            const data = {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: dynamicColors,
                }],
            };

            this._chartInstance = new Chart(ctx, {
                type: "pie",
                data,
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: "top",
                            labels: {
                                boxWidth: 20,
                                font: { size: 13 }
                            }
                        },
                    },
                },
            });
        } catch (error) {
            console.error("Failed to load pie chart", error);
        }
    }


    async compareSalespersons() {
        const id1 = this.state.comparison.salesperson1;
        const id2 = this.state.comparison.salesperson2;

        if (!id1 || !id2 || id1 === id2) {
            this.state.comparisonResult = {
                salesperson_1: {
                    total: 0, won: 0, lost: 0,
                    expected_revenue: 0, all_revenue: 0, conversion_rate: 0
                },
                salesperson_2: {
                    total: 0, won: 0, lost: 0,
                    expected_revenue: 0, all_revenue: 0, conversion_rate: 0
                },
            };
            this.state.bestSalespersonName = "Please choose two different salespersons.";
            return;
        }

        const [stats1, stats2] = await Promise.all([
            this.rpc("/crm_dashboard/salesperson_stats", { user_id: id1 }),
            this.rpc("/crm_dashboard/salesperson_stats", { user_id: id2 }),
        ]);

        // Score = Won deals (x2) + Conversion rate + Actual earned revenue
        const score1 = stats1.won * 2 + stats1.conversion_rate + stats1.all_revenue;
        const score2 = stats2.won * 2 + stats2.conversion_rate + stats2.all_revenue;

        this.state.comparisonResult = {
            salesperson_1: stats1,
            salesperson_2: stats2,
        };

        if (score1 === score2) {
            this.state.bestSalespersonName = "Both performed equally.";
        } else {
            this.state.bestSalespersonName = score1 > score2 ? stats1.name : stats2.name;
        }
    }


    closeComparisonResult() {
    this.state.comparisonResult = null;
    this.state.bestSalespersonName = "";
}


    async renderLostReasons() {
        const ctx = this.lostReasonsChartRef?.el?.getContext("2d");
        if (!ctx) return;

        if (this._lostChartInstance) {
            this._lostChartInstance.destroy();
        }

        const total = this.state.lost_reasons.reduce((sum, r) => sum + r.count, 0);

        const data = {
            labels: this.state.lost_reasons.map(r => r.name),
            datasets: [{
                label: "Lost Count",
                data: this.state.lost_reasons.map(r => r.count),
                backgroundColor: "#e74c3c"
            }],
        };

        const options = {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const index = context.dataIndex;
                            const reason = this.state.lost_reasons[index];
                            const percent = ((reason.count / total) * 100).toFixed(2);
                            return `${reason.count} (${percent}%)`;
                        }
                    }
                },
                legend: { display: false },
            },
        };

        this._lostChartInstance = new Chart(ctx, {
            type: 'bar',
            data,
            options,
        });
    }

    // 🔽 Action handlers for each metric card
    openOpportunitiesInProgress() {
        this._doActionFiltered([
            ["type", "=", "opportunity"],
            ["probability", ">", 0],
            ["probability", "<", 100],
            ["active", "=", true]
        ], "Opportunities In Progress");
    }

    openOpportunitiesThisMonth() {
        const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
        this._doActionFiltered([
            ["type", "=", "opportunity"],
            ["create_date", ">=", firstDay]
        ], "This Month’s Opportunities");
    }

    openOverdueActivities() {
        const today = new Date().toISOString().slice(0, 10);
        this._doActionFiltered([
            ["type", "=", "opportunity"],
            ["activity_type_id", "!=", false],
            ["activity_date_deadline", "<", today]
        ], "Overdue CRM Activities");
    }

    openScheduledActivities() {
        const today = new Date().toISOString().slice(0, 10);
        this._doActionFiltered([
            ["type", "=", "opportunity"],
            ["activity_type_id", "!=", false],
            ["activity_date_deadline", ">=", today]
        ], "Scheduled CRM Activities");
    }

    openExpectedRevenue() {
        this._doActionFiltered([
            ["type", "=", "opportunity"],
            ["probability", ">", 0],
            ["probability", "<", 100],
            ["active", "=", true]
        ], "Expected Revenue Opportunities");
    }

    openWonOpportunities() {
        this._doActionFiltered([
            ["type", "=", "opportunity"],
            ["probability", "=", 100]
        ], "Won Opportunities");
    }

    openLostOpportunities() {
        this._doActionFiltered([
            ["type", "=", "opportunity"],
            ["active", "=", false]
        ], "Lost Opportunities");
    }

    openTotalLeads() {
        this._doActionFiltered([
            ["type", "=", "opportunity"]
        ], "All Leads");
    }

    openDoctorAnalysis() {
    this._doActionFiltered([
        ["type", "=", "opportunity"],
        ["stage_id.name", "=", "New"]
    ], "New Opportunities");
}

openAccountManagement() {
    this._doActionFiltered([
        ["type", "=", "opportunity"],
        ["stage_id.name", "=", "Proposition"]
    ], "Proposition Opportunities");
}

    _doActionFiltered(domain, title) {
        const user_id = this.state.selected_salesperson || false;
        if (user_id) {
            domain.push(["user_id", "=", parseInt(user_id)]);
        }

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: title,
            res_model: "crm.lead",
            view_mode: "kanban,list,form",
            views: [[false, "kanban"], [false, "list"], [false, "form"]],
            domain,
        });
    }
}

CrmDashboard.template = "CrmDashborad";
registry.category("actions").add("crm_dashboard_smart", CrmDashboard);