/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useState, onMounted, onWillUnmount } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class CrmDashboard extends Component {
    setup() {

        


        this.rpc = useService("rpc");
        this.actionService = useService("action");
        this.state = useState({

            total_sales: "183.23K",
            total_purchase: "114.57K",
            stock_transfer: "227.00",
            total_leads: "923.00",
            account_journal: "61.00",
            bank_statements: "1.00",
            manufacturing_order: "10.00",
            pos_order: "1.07M",
            
            // List data - initialize as empty arrays if data not available yet
            top_sales: [
                {id: 1, name: "Chen Adiza"},
                {id: 2, name: "Juei Witsi"},
                {id: 3, name: "Gemes Furniture"}
            ],
            top_vendors: [
                {id: 1, name: "Lumber Inc."},
                {id: 2, name: "Ready Mae"},
                {id: 3, name: "80000"},
                {id: 4, name: "00000"},
                {id: 5, name: "40000"},
                {id: 6, name: "20000"}
            ],
            top_leads: [
                {id: 1, name: "Chen Adiza"},
                {id: 2, name: "Ready Mae"},
                {id: 3, name: "Gemes Furniture"},
                {id: 4, name: "Lumber Inc."},
                {id: 5, name: "Gemes Furniture"}
            ],

            total: 0,
            won: 0,
            lost: 0,
            in_progress: 0,  // ✅ الجديد
            this_month: 0, // ✅ الكارت الجديد
            overdue: 0, // ✅ جديد
            scheduled: 0, // ✅ جديد
            expected_revenue: 0, // ✅ الجديد
            won: 0, // ✅ الجديد
            lost: 0, // ✅ الجديد
            conversion_rate: 0, // ✅ الجديد

            selected_salesperson: "",  // ← selected ID
            salespersons: [],          // ← list of users to populate dropdown
            total_leads: 0,








        });

        // Initial fetch before render
        // onWillStart(this.fetchAllCounts.bind(this));

        onWillStart(async () => {
            const users = await this.rpc("/crm_dashboard/salespersons");
            this.state.salespersons = users;
            await this.fetchAllCounts();
        });



        

        


        // Start periodic updates
        onMounted(() => {
            this._intervalId = setInterval(this.fetchAllCounts.bind(this), 10000);
        });

        // Clean up
        onWillUnmount(() => {
            clearInterval(this._intervalId);
        });
    }

    onSalespersonChange(ev) {
    const selectedId = ev.target.value;
    this.state.selected_salesperson = selectedId;
    this.fetchAllCounts();  // re-fetch based on new user
}



    async fetchAllCounts() {
        const user_id = this.state.selected_salesperson || null;

        try {
            const [inProgress,thisMonth,overdue,scheduled,expectedRevenue,won,lost,conversionRate,totalLeads] = await Promise.all([
                this.rpc("/crm_dashboard/in_progress_opportunities" , { user_id }),
                this.rpc("/crm_dashboard/this_month_opportunities" ,{ user_id }),
                this.rpc("/crm_dashboard/overdue_activities"  ,{ user_id }),
                this.rpc("/crm_dashboard/scheduled_activities"  ,{ user_id }),
                this.rpc("/crm_dashboard/expected_revenue"  ,{ user_id }),
                this.rpc("/crm_dashboard/won_opportunities"  ,{ user_id }),
                this.rpc("/crm_dashboard/lost_opportunities"  ,{ user_id }),
                this.rpc("/crm_dashboard/conversion_rate"  ,{ user_id }),
                this.rpc("/crm_dashboard/total_leads", { user_id }),







            ]);
            console.log("In Progress:", inProgress);
            this.state.in_progress = inProgress;
            this.state.this_month = thisMonth;
            this.state.overdue = overdue;
            this.state.scheduled = scheduled;
            this.state.expected_revenue = expectedRevenue;
            this.state.won = won;
            this.state.lost = lost;
            this.state.conversion_rate = conversionRate;
            this.state.total_leads = totalLeads;

            






        } catch (e) {
            console.error("Failed to fetch metrics", e);
        }
    }


    openOpportunitiesInProgress() {
    
    const user_id = this.state.selected_salesperson || false;

    const domain = [
            ['type', '=', 'opportunity'],
            ['probability', '>', 0],
            ['probability', '<', 100],
            ['active', '=', true]];
    if (user_id) {
        domain.push(['user_id', '=', parseInt(user_id)]);
    }


    this.actionService.doAction({
        type: "ir.actions.act_window",
        name: "Opportunities In Progress",
        res_model: "crm.lead",
        view_mode: "kanban,list,form",
        views: [
            [false, "kanban"],
            [false, "list"],
            [false, "form"]
        ],
        domain,
    });
}

openOpportunitiesThisMonth() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const firstDayStr = firstDay.toISOString().slice(0, 10); // yyyy-mm-dd


    const user_id = this.state.selected_salesperson || false;

    const domain = [
            ['type', '=', 'opportunity'],
            ['create_date', '>=', firstDayStr]];
    if (user_id) {
        domain.push(['user_id', '=', parseInt(user_id)]);
    }

    

    this.actionService.doAction({
        type: "ir.actions.act_window",
        name: "This Month’s Opportunities",
        res_model: "crm.lead",
        view_mode: "kanban,list,form",
        views: [
            [false, "kanban"],
            [false, "list"],
            [false, "form"]
        ],
        domain,
    });
}

openOverdueActivities() {
    const today = new Date().toISOString().slice(0, 10);

    const user_id = this.state.selected_salesperson || false;

    const domain = [
            ['type', '=', 'opportunity'],
            ['activity_type_id', '!=', false],
            ['activity_date_deadline', '<', today]];
    if (user_id) {
        domain.push(['user_id', '=', parseInt(user_id)]);
    }

    this.actionService.doAction({
        type: "ir.actions.act_window",
        name: "Overdue CRM Activities",
        res_model: "crm.lead",
        view_mode: "kanban,list,form",
        views: [
            [false, "kanban"],
            [false, "list"],
            [false, "form"]
        ],
        domain,
    });
}

openScheduledActivities() {

    const today = new Date().toISOString().slice(0, 10);
    const user_id = this.state.selected_salesperson || false;

    const domain = [
            ['type', '=', 'opportunity'],
            ['activity_type_id', '!=', false],
            ['activity_date_deadline', '>=', today]];
    if (user_id) {
        domain.push(['user_id', '=', parseInt(user_id)]);
    }
    

    this.actionService.doAction({
        type: "ir.actions.act_window",
        name: "Scheduled CRM Activities",
        res_model: "crm.lead",
        view_mode: "kanban,list,form",
        views: [
            [false, "kanban"],
            [false, "list"],
            [false, "form"]
        ],
        domain,
    });
}


openExpectedRevenue() {

    const user_id = this.state.selected_salesperson || false;

    const domain = [
            ['type', '=', 'opportunity'],
            ['type', '=', 'opportunity'],
            ['probability', '>', 0],
            ['probability', '<', 100],
            ['active', '=', true],];
    if (user_id) {
        domain.push(['user_id', '=', parseInt(user_id)]);
    }

    this.actionService.doAction({
        type: "ir.actions.act_window",
        name: "Expected Revenue Opportunities",
        res_model: "crm.lead",
        view_mode: "kanban,list,form",
        views: [
            [false, "kanban"],
            [false, "list"],
            [false, "form"]
        ],
        domain,
    });
}


openWonOpportunities() {
    const user_id = this.state.selected_salesperson || false;

    const domain = [['type', '=', 'opportunity'],['probability', '=', 100]];
    if (user_id) {
        domain.push(['user_id', '=', parseInt(user_id)]);
    }

    this.actionService.doAction({
        type: "ir.actions.act_window",
        name: "Won Opportunities",
        res_model: "crm.lead",
        view_mode: "kanban,list,form",
        views: [
            [false, "kanban"],
            [false, "list"],
            [false, "form"]
        ],
        domain,
    });
}


openLostOpportunities() {

    const user_id = this.state.selected_salesperson || false;

    const domain = [['type', '=', 'opportunity'],['active', '=', false]];
    if (user_id) {
        domain.push(['user_id', '=', parseInt(user_id)]);
    }

    this.actionService.doAction({
        type: "ir.actions.act_window",
        name: "Lost Opportunities",
        res_model: "crm.lead",
        view_mode: "kanban,list,form",
        views: [
            [false, "kanban"],
            [false, "list"],
            [false, "form"]
        ],
        domain,
    });
}


openTotalLeads() {
    const user_id = this.state.selected_salesperson || false;

    const domain = [['type', '=', 'opportunity']];
    if (user_id) {
        domain.push(['user_id', '=', parseInt(user_id)]);
    }

    this.actionService.doAction({
        type: "ir.actions.act_window",
        name: "All Leads",
        res_model: "crm.lead",
        view_mode: "kanban,list,form",
        views: [
            [false, "kanban"],
            [false, "list"],
            [false, "form"]
        ],
        domain,
    });
}




}

CrmDashboard.template = "CrmDashborad";
registry.category("actions").add("crm_dashboard_smart", CrmDashboard);
