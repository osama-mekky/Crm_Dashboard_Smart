# -*- coding: utf-8 -*-
{
    'name': "crm_dashboard_smart",

    'summary': "Advanced CRM dashboard with KPIs and visual charts",
    'description': """
	This module adds a smart CRM dashboard to monitor leads and opportunities.
	Features:
	- Total leads count by stage
	- Bar & pie charts using Chart.js
	- Responsive UI with animations
	- Easy access to sales metrics
	""",

    'author': "Osama Mekky",
    'website': "https://gosmart.eg",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Sales',

    'version': '17.0.1.0.0',


    # any module necessary for this one to work correctly
    'depends': ['base','crm'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/views.xml',
    ],

    'assets': {
        'web.assets_backend': [
            'crm_dashboard_smart/static/src/css/dashboard.css',
            'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css',
            'crm_dashboard_smart/static/src/js/dashboard.js',
            'crm_dashboard_smart/static/src/xml/dashboard.xml',

        ],
		'web.assets_frontend':[],
    },

    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],

    'license': 'LGPL-3',
    'application': True,
    'installable': True,
}

