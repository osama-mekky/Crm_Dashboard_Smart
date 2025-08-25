# -*- coding: utf-8 -*-

# from odoo import models, fields, api


# class crm_dashboard_smart(models.Model):
#     _name = 'crm_dashboard_smart.crm_dashboard_smart'
#     _description = 'crm_dashboard_smart.crm_dashboard_smart'

#     name = fields.Char()
#     value = fields.Integer()
#     value2 = fields.Float(compute="_value_pc", store=True)
#     description = fields.Text()
#
#     @api.depends('value')
#     def _value_pc(self):
#         for record in self:
#             record.value2 = float(record.value) / 100

