from odoo import http, fields
from odoo.http import request
from datetime import date

class CrmDashboardController(http.Controller):

    def _add_user_filter(self, domain, user_id):
        if user_id:
            domain.append(('user_id', '=', int(user_id)))
        return domain

    @http.route('/crm_dashboard/in_progress_opportunities', type='json', auth='user')
    def in_progress_opportunities(self, user_id=None):
        domain = [
            ('type', '=', 'opportunity'),
            ('probability', '>', 0),
            ('probability', '<', 100),
            ('active', '=', True),
        ]
        domain = self._add_user_filter(domain, user_id)
        return request.env['crm.lead'].sudo().search_count(domain)

    @http.route('/crm_dashboard/this_month_opportunities', type='json', auth='user')
    def this_month_opportunities(self, user_id=None):
        first_day = date.today().replace(day=1)
        domain = [
            ('type', '=', 'opportunity'),
            ('create_date', '>=', fields.Date.to_string(first_day)),
        ]
        domain = self._add_user_filter(domain, user_id)
        return request.env['crm.lead'].sudo().search_count(domain)

    @http.route('/crm_dashboard/overdue_activities', type='json', auth='user')
    def overdue_activities(self, user_id=None):
        today = fields.Date.today()
        domain = [
            ('type', '=', 'opportunity'),
            ('activity_type_id', '!=', False),
            ('activity_date_deadline', '<', fields.Date.to_string(today)),
        ]
        domain = self._add_user_filter(domain, user_id)
        return request.env['crm.lead'].sudo().search_count(domain)

    @http.route('/crm_dashboard/scheduled_activities', type='json', auth='user')
    def scheduled_activities(self, user_id=None):
        today = fields.Date.today()
        domain = [
            ('type', '=', 'opportunity'),
            ('activity_type_id', '!=', False),
            ('activity_date_deadline', '>=', fields.Date.to_string(today)),
        ]
        domain = self._add_user_filter(domain, user_id)
        return request.env['crm.lead'].sudo().search_count(domain)

    @http.route('/crm_dashboard/expected_revenue', type='json', auth='user')
    def expected_revenue(self, user_id=None):
        domain = [
            ('type', '=', 'opportunity'),
            ('probability', '>', 0),
            ('probability', '<', 100),
            ('active', '=', True),
        ]
        domain = self._add_user_filter(domain, user_id)
        leads = request.env['crm.lead'].sudo().search(domain)
        return sum(leads.mapped('expected_revenue'))

    @http.route('/crm_dashboard/won_opportunities', type='json', auth='user')
    def won_opportunities(self, user_id=None):
        domain = [
            ('type', '=', 'opportunity'),
            ('probability', '=', 100),
        ]
        domain = self._add_user_filter(domain, user_id)
        return request.env['crm.lead'].sudo().search_count(domain)

    @http.route('/crm_dashboard/lost_opportunities', type='json', auth='user')
    def lost_opportunities(self, user_id=None):
        domain = [
            ('type', '=', 'opportunity'),
            ('active', '=', False),
        ]
        domain = self._add_user_filter(domain, user_id)
        return request.env['crm.lead'].sudo().search_count(domain)

    @http.route('/crm_dashboard/conversion_rate', type='json', auth='user')
    def conversion_rate(self, user_id=None):
        base_domain = [('type', '=', 'opportunity')]
        domain = self._add_user_filter(base_domain[:], user_id)
        total = request.env['crm.lead'].sudo().search_count(domain)

        won_domain = domain + [('probability', '=', 100)]
        won = request.env['crm.lead'].sudo().search_count(won_domain)

        return round((won / total * 100), 2) if total > 0 else 0

    @http.route('/crm_dashboard/salespersons', type='json', auth='user')
    def get_salespersons(self):
        users = request.env['res.users'].sudo().search([])
        return [{'id': u.id, 'name': u.name} for u in users]



    @http.route('/crm_dashboard/total_leads', type='json', auth='user')
    def total_leads(self, user_id=None):
        domain = [('type', '=', 'opportunity')]
        if user_id:
            domain.append(('user_id', '=', int(user_id)))
        return request.env['crm.lead'].sudo().search_count(domain)



    @http.route('/crm_dashboard/leads_by_salesperson', type='json', auth='user')
    def leads_by_salesperson(self):
        records = request.env['crm.lead'].sudo().read_group(
            [('type', '=', 'opportunity')],
            ['user_id'],
            ['user_id']
        )

        labels = []
        values = []
        colors = ['#6256a9', '#04aec6', '#ff2d78', '#ffc107', '#28a745', '#17a2b8', '#6f42c1']

        for idx, rec in enumerate(records):
            user = request.env['res.users'].browse(rec['user_id'][0]) if rec['user_id'] else None
            labels.append(user.name if user else "Unassigned")
            values.append(rec['user_id_count'])

        return {
            'labels': labels,
            'values': values,
            'colors': colors[:len(labels)],
        }



    @http.route('/crm_dashboard/lost_reasons', type='json', auth='user')
    def lost_reasons(self, user_id=None):
        domain = [('type', '=', 'opportunity'), ('active', '=', False)]
        if user_id:
            domain.append(('user_id', '=', int(user_id)))

        results = request.env['crm.lead'].read_group(
            domain,
            ['lost_reason_id'],
            ['lost_reason_id'],
            lazy=False
        )

        reason_ids = [res['lost_reason_id'][0] for res in results if res['lost_reason_id']]
        reasons = {r.id: r.name for r in request.env['crm.lost.reason'].browse(reason_ids)}

        return [
            {
                'id': res['lost_reason_id'][0],
                'name': reasons.get(res['lost_reason_id'][0], 'Unknown'),
                'count': res['__count'],
            }
            for res in results if res['lost_reason_id']
        ]



    @http.route('/crm_dashboard/new_opportunities', type='json', auth='user')
    def new_opportunities(self, user_id=None):
        domain = [('type', '=', 'opportunity')]
        
        if user_id:
            domain.append(('user_id', '=', int(user_id)))

        # Add stage name condition
        domain.append(('stage_id.name', '=', 'New'))

        count = request.env['crm.lead'].sudo().search_count(domain)
        return count


    @http.route('/crm_dashboard/proposition_count', type='json', auth='user')
    def proposition_count(self, user_id=None):
        domain = [
            ('type', '=', 'opportunity'),
            ('stage_id.name', '=', 'Proposition'),
        ]
        if user_id:
            domain.append(('user_id', '=', int(user_id)))

        count = request.env['crm.lead'].sudo().search_count(domain)
        return count



    @http.route('/crm_dashboard/salesperson_stats', type='json', auth='user')
    def salesperson_stats(self, user_id):
        domain = [('user_id', '=', int(user_id)), ('type', '=', 'opportunity')]
        leads = request.env['crm.lead'].search(domain)



        lost_domain = domain + [('active', '=', False)]



        won = leads.filtered(lambda l: l.probability == 100)
        non_won = leads - won  # All opportunities that are not won

        total = len(leads)
        won_count = len(won)
        lost_count = request.env['crm.lead'].search_count(lost_domain)

        print(f"User ID: {user_id}, Total: {total}, Won: {won_count}, Lost: {lost_count}")
        print(f"User ID: {user_id}, Total: {total}, Won: {won_count}, Lost: {lost_count}")


        # ✅ Sum revenues separately
        expected_revenue = sum(non_won.mapped('expected_revenue'))   # Not won
        all_revenue = sum(won.mapped('expected_revenue'))            # Only won

        conversion_rate = (won_count / total) * 100 if total > 0 else 0.0
        user = request.env['res.users'].browse(int(user_id))

        return {
            'user_id': user_id,
            'name': user.name,
            'won': won_count,
            'lost': lost_count,
            'total': total,
            'expected_revenue': round(expected_revenue, 2),
            'all_revenue': round(all_revenue, 2),
            'conversion_rate': round(conversion_rate, 2),
        }
