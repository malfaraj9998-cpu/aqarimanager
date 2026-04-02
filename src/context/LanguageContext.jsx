import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const dictionaries = {
  en: {
    // Nav
    dashboard: 'Dashboard', finance: 'Finance', clients: 'Clients',
    buildings: 'Buildings', contracts: 'Contracts', settings: 'Settings',
    search: 'Search...', welcome: 'Welcome back',
    
    // Dashboard Stats
    totalBuildings: 'Total Buildings', occupancyRate: 'Occupancy Rate', 
    totalTenants: 'Total Tenants', expiringSoon: 'Expiring Soon',
    revenueGrowth: 'Revenue Growth', recentActivity: 'Recent Activity',
    generateReport: 'Generate Report', vsLastYear: 'vs Last Year', selectYear: 'Select Year',
    admin: 'Admin', dashboardSubtitle: "Here's what's happening with your properties today.",
    rentPaidBy: 'Rent paid by', contractExpiringFor: 'Contract expiring for', newLeaseSignedBy: 'New lease signed by',
    hoursAgo: 'hours ago', dayAgo: 'day ago',
    
    // General
    overview: 'Overview', active: 'Active', expired: 'Expired', 
    available: 'Available', leased: 'Leased', noContract: 'No Contract',
    cancel: 'Cancel', save: 'Save', add: 'Add', actions: 'Actions',
    
    // Buildings
    buildingsOverview: 'Buildings Overview', addBuilding: 'Add Building',
    occupancy: 'Occupancy', units: 'Units', addUnit: 'Add Unit',
    buildingName: 'Building Name', location: 'Location / Address',
    buildingType: 'Building Type', totalUnits: 'Total Number of Units',
    saveBuilding: 'Save Building', mixedUse: 'Mixed Use',
    commercial: 'Commercial', office: 'Office', retail: 'Retail',
    residential: 'Residential',
    noBuildingsFound: 'No buildings found. Add your first property to get started.',
    
    // Building Details
    unitNumber: 'Unit Number', unitType: 'Type', squareMeters: 'Square Meters',
    status: 'Status', currentClient: 'Current Client', assignContract: 'Assign Contract',
    registerNewUnit: 'Register New Unit', classificationType: 'Classification Type',
    internalArea: 'Internal Area (Square Meters)', saveUnit: 'Save Unit',
    flat: 'Flat / Apartment', shop: 'Retail Shop', officeSpace: 'Office Space',
    floor: 'Floor',

    // Clients
    clientsContracts: 'Clients & Contracts', addNewClient: 'Add New Client',
    tenantName: 'Tenant Name', clientType: 'Client Type', idVatNumber: 'ID / VAT Number',
    contactInfo: 'Contact info', contractPeriod: 'Contract Period',
    registerNewClient: 'Register New Client', fullNameCompany: 'Full Name / Company Name',
    nationality: 'Nationality / Origin', mobileNumber: 'Mobile Number',
    emailAddress: 'Email Address', saveClient: 'Save Client',
    individual: 'Individual (Person)', retailBusiness: 'Retail Business',
    foodBev: 'Food & Beverage', techCorp: 'Tech Corporation',
    healthWellness: 'Health & Wellness', telecom: 'Telecommunications', otherEntity: 'Other Entity',
    noClientsFound: 'No clients found matching your search.',
    searchClients: 'Search by name, ID or mobile...',
    
    // Finance
    financeLedger: 'Finance Ledger', recordTransaction: 'Record Transaction',
    totalIncome: 'Total Income', totalExpenses: 'Total Expenses', netProfit: 'Net Profit',
    fromLastMonth: 'from last month', cashflowOverview: 'Cashflow Overview (YTD)',
    searchTransactions: 'Search transactions...', date: 'Date', transactionType: 'Transaction Type',
    propertyEntity: 'Property / Entity', description: 'Description', amountSAR: 'Amount (SAR)',
    currencySAR: 'SAR',
    noTransactionsFound: 'No transactions found.',
    incomeRev: 'Income (Revenue)', expenseCost: 'Expense (Cost)', category: 'Category',
    rentPayment: 'Rent Payment', serviceCharge: 'Service Charge', lateFee: 'Late Fee',
    otherRevenue: 'Other Revenue', maintenance: 'Maintenance / Repair',
    utilityBill: 'Utility Bill', taxes: 'Taxes / Municipality', payroll: 'Payroll / Staff',
    otherExpense: 'Other Expense', linkedProperty: 'Linked Property / Entity',
    generalOperations: 'General Operations', notes: 'Description / Notes', saveTransaction: 'Save Transaction',
    filter: 'Filter',

    // Contracts Wizard
    newContract: 'New Contract', newContractGenerator: 'New Contract Generator',
    step1: 'Select Client', step2: 'Select Property', step3: 'Terms & Finalize',
    clientInfo: 'Client Information', selectExistingClient: 'Select Existing Client',
    chooseClient: '-- Choose Client --', createNewClient: '+ Create New Client',
    propertySelect: 'Property & Unit Selection', assignUnit: 'Assign Unit',
    selectBuilding: '-- Select Building --', selectAvailableUnit: '-- Select Available Unit --',
    leaseTerms: 'Lease Terms', startDate: 'Start Date', endDate: 'End Date',
    annualRent: 'Annual Rent (SAR)', paymentFrequency: 'Payment Frequency',
    monthly: 'Monthly', quarterly: 'Quarterly', annually: 'Annually', halfYearly: 'Half Yearly',
    uponSubmission: 'Upon submission, the contract will be set to Active and the Unit status will update to Leased.',
    back: 'Back', continue: 'Continue', finalizeContract: 'Finalize Contract',
    ledger: 'Ledger', archivedLedger: 'Archived Ledger', searchContracts: 'Search by Client, ID, Ejar...',
    contractIdEjar: 'Contract ID / Ejar', propertyUnit: 'Property & Unit', period: 'Period',
    noEjar: 'No Ejar', unknownClient: 'Unknown Client', renew: 'Renew', 
    renewContractGenerator: 'Renew Contract Generator', contractSummary: 'Contract Summary',
    noActiveContractsFound: 'No active contracts found.', noArchivedContractsFound: 'No archived contracts found.',
    annualRentAmount: 'Annual Rent (SAR)', client: 'Client', contractsLedger: 'Contracts Ledger',

    // DB Exact Value Mappings
    'Individual': 'Individual', 'Retail': 'Retail', 'F&B': 'F&B', 'Tech Corporation': 'Tech Corporation',
    'Telecommunications': 'Telecommunications', 'Other': 'Other', 'Mixed Use': 'Mixed Use', 
    'Commercial': 'Commercial', 'Office': 'Office', 'Residential': 'Residential', 'Flat': 'Flat',
    'Shop': 'Shop', 'Active': 'Active', 'Expired': 'Expired', 'Archived': 'Archived', 
    'Leased': 'Leased', 'Available': 'Available', 'No Active Contract': 'No Active Contract',
    'INCOME': 'INCOME', 'EXPENSE': 'EXPENSE', 'Monthly': 'Monthly', 'Quarterly': 'Quarterly', 'Half Yearly': 'Half Yearly', 'Annually': 'Annually', 'Service Charge': 'Service Charge', 
    'Late Fee': 'Late Fee', 'Other Revenue': 'Other Revenue', 'Maintenance / Repair': 'Maintenance / Repair', 
    'Utility Bill': 'Utility Bill', 'Taxes / Municipality': 'Taxes / Municipality', 'Payroll / Staff': 'Payroll / Staff', 'Other Expense': 'Other Expense'
  },
  ar: {
    // Nav
    dashboard: 'لوحة القيادة', finance: 'المالية', clients: 'العملاء',
    buildings: 'المباني', contracts: 'العقود', settings: 'الإعدادات',
    search: 'بحث...', welcome: 'مرحباً بعودتك',
    
    // Dashboard Stats
    totalBuildings: 'إجمالي المباني', occupancyRate: 'نسبة الإشغال', 
    totalTenants: 'إجمالي المستأجرين', expiringSoon: 'تنتهي قريباً',
    revenueGrowth: 'نمو الإيرادات', recentActivity: 'النشاط الأخير',
    generateReport: 'إنشاء تقرير', vsLastYear: 'مقارنة بالعام الماضي', selectYear: 'اختر السنة',
    admin: 'المسؤول', dashboardSubtitle: "إليك ما يحدث في عقاراتك اليوم.",
    rentPaidBy: 'تم دفع الإيجار بواسطة', contractExpiringFor: 'انتهاء العقد لـ', newLeaseSignedBy: 'عقد جديد موقع من',
    hoursAgo: 'ساعات مضت', dayAgo: 'يوم مضى',
    
    // General
    overview: 'نظرة عامة', active: 'نشط', expired: 'منتهي', 
    available: 'متاح', leased: 'مؤجر', noContract: 'لا يوجد عقد',
    cancel: 'إلغاء', save: 'حفظ', add: 'إضافة', actions: 'إجراءات',
    
    // Buildings
    buildingsOverview: 'نظرة عامة على المباني', addBuilding: 'إضافة مبنى',
    occupancy: 'الإشغال', units: 'الوحدات', addUnit: 'إضافة وحدة',
    buildingName: 'اسم المبنى', location: 'الموقع / العنوان',
    buildingType: 'نوع المبنى', totalUnits: 'إجمالي عدد الوحدات',
    saveBuilding: 'حفظ المبنى', mixedUse: 'استخدام مختلط',
    commercial: 'تجاري', office: 'مكتب', retail: 'تجزئة',
    residential: 'سكني',
    noBuildingsFound: 'لم يتم العثور على مبانٍ. أضف عقارك الأول للبدء.',
    
    // Building Details
    unitNumber: 'رقم الوحدة', unitType: 'النوع', squareMeters: 'المساحة (متر مربع)',
    status: 'الحالة', currentClient: 'العميل الحالي', assignContract: 'تخصيص عقد',
    registerNewUnit: 'تسجيل وحدة جديدة', classificationType: 'نوع التصنيف',
    internalArea: 'المساحة الداخلية (متر مربع)', saveUnit: 'حفظ الوحدة',
    flat: 'شقة', shop: 'محل تجاري', officeSpace: 'مساحة مكتبية',
    floor: 'الدور',

    // Clients
    clientsContracts: 'العملاء والعقود', addNewClient: 'إضافة عميل جديد',
    tenantName: 'اسم المستأجر', clientType: 'نوع العميل', idVatNumber: 'الهوية / الرقم الضريبي',
    contactInfo: 'معلومات الاتصال', contractPeriod: 'مدة العقد',
    registerNewClient: 'تسجيل عميل جديد', fullNameCompany: 'الاسم الكامل / اسم الشركة',
    nationality: 'الجنسية / الأصل', mobileNumber: 'رقم الجوال',
    emailAddress: 'البريد الإلكتروني', saveClient: 'حفظ العميل',
    individual: 'فرد (شخص)', retailBusiness: 'أعمال تجزئة',
    foodBev: 'أغذية ومشروبات', techCorp: 'شركة تقنية',
    healthWellness: 'صحة ولياقة', telecom: 'اتصالات', otherEntity: 'كيان آخر',
    noClientsFound: 'لم يتم العثور على عملاء يطابقون بحثك.',
    searchClients: 'ابحث بالاسم، الهوية أو الجوال...',
    
    // Finance
    financeLedger: 'سجل المالية', recordTransaction: 'تسجيل معاملة',
    totalIncome: 'إجمالي الدخل', totalExpenses: 'إجمالي المصروفات', netProfit: 'صافي الربح',
    fromLastMonth: 'عن الشهر الماضي', cashflowOverview: 'نظرة على التدفق المالي (منذ بداية العام)',
    searchTransactions: 'البحث في المعاملات...', date: 'التاريخ', transactionType: 'نوع المعاملة',
    propertyEntity: 'العقار / الكيان', description: 'الوصف', amountSAR: 'المبلغ (ر.س)',
    currencySAR: 'ر.س',
    noTransactionsFound: 'لم يتم العثور على معاملات.',
    incomeRev: 'دخل (إيرادات)', expenseCost: 'مصروفات (تكلفة)', category: 'الفئة',
    rentPayment: 'دفع الإيجار', serviceCharge: 'رسوم خدمة', lateFee: 'رسوم تأخير',
    otherRevenue: 'إيرادات أخرى', maintenance: 'صيانة / إصلاح',
    utilityBill: 'فاتورة خدمات', taxes: 'ضرائب / بلدية', payroll: 'رواتب / موظفين',
    otherExpense: 'مصروفات أخرى', linkedProperty: 'العقار / الكيان المرتبط',
    generalOperations: 'العمليات العامة', notes: 'الوصف / ملاحظات', saveTransaction: 'حفظ المعاملة',
    filter: 'تصفية',

    // Contracts Wizard
    newContract: 'عقد جديد', newContractGenerator: 'منشئ العقود',
    step1: 'تحديد العميل', step2: 'تحديد العقار', step3: 'الشروط والاعتماد',
    clientInfo: 'معلومات العميل', selectExistingClient: 'اختر عميل حالي',
    chooseClient: '-- اختر العميل --', createNewClient: '+ إنشاء عميل جديد',
    propertySelect: 'اختيار العقار والوحدة', assignUnit: 'تخصيص الوحدة',
    selectBuilding: '-- اختر المبنى --', selectAvailableUnit: '-- اختر وحدة متاحة --',
    leaseTerms: 'شروط الإيجار', startDate: 'تاريخ البدء', endDate: 'تاريخ الانتهاء',
    annualRent: 'الإيجار السنوي (ر.س)', paymentFrequency: 'دورية الدفع',
    monthly: 'شهري', quarterly: 'ربع سنوي', annually: 'سنوي', halfYearly: 'نصف سنوي',
    uponSubmission: 'عند التقديم، سيتم تعيين العقد إلى "نشط" وسيتم تحديث حالة الوحدة إلى "مؤجر".',
    back: 'السابق', continue: 'التالي', finalizeContract: 'اعتماد العقد',
    ledger: 'السجل', archivedLedger: 'السجل المؤرشف', searchContracts: 'البحث عن طريق العميل، الهوية، رقم إيجار...',
    contractIdEjar: 'رقم العقد / إيجار', propertyUnit: 'العقار والوحدة', period: 'المدة',
    noEjar: 'لا يوجد إيجار', unknownClient: 'عميل غير معروف', renew: 'تجديد', 
    renewContractGenerator: 'منشئ تجديد العقود', contractSummary: 'ملخص العقد',
    noActiveContractsFound: 'لم يتم العثور على عقود نشطة.', noArchivedContractsFound: 'لم يتم العثور على عقود مؤرشفة.',
    annualRentAmount: 'الإيجار السنوي (ر.س)', client: 'العميل', contractsLedger: 'سجل العقود',

    // DB Exact Value Mappings
    'Individual': 'فرد', 'Retail': 'تجزئة', 'F&B': 'أغذية ومشروبات', 'Tech Corporation': 'شركة تقنية',
    'Telecommunications': 'اتصالات', 'Other': 'أخرى', 'Mixed Use': 'مختلط', 
    'Commercial': 'تجاري', 'Office': 'مكتب', 'Residential': 'سكني', 'Flat': 'شقة',
    'Shop': 'محل', 'Active': 'نشط', 'Expired': 'منتهي', 'Archived': 'مؤرشف', 
    'Leased': 'مؤجر', 'Available': 'متاح', 'No Active Contract': 'لا يوجد عقد',
    'INCOME': 'إيراد', 'EXPENSE': 'مصروف', 'Monthly': 'شهري', 'Quarterly': 'ربع سنوي', 'Half Yearly': 'نصف سنوي', 'Annually': 'سنوي', 'Rent Payment': 'دفع الإيجار', 'Service Charge': 'رسوم خدمة', 
    'Late Fee': 'رسوم تأخير', 'Other Revenue': 'إيرادات أخرى', 'Maintenance / Repair': 'صيانة / إصلاح', 
    'Utility Bill': 'فاتورة خدمات', 'Taxes / Municipality': 'ضرائب / بلدية', 'Payroll / Staff': 'رواتب / موظفين', 'Other Expense': 'مصروفات أخرى',
    'Export PDF': 'تصدير PDF', 'Export Excel': 'تصدير Excel', 'Export': 'تصدير'
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    root.setAttribute('lang', language);
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = (key) => dictionaries[language][key] || key;

  const formatDateDual = (dateInput) => {
    if (!dateInput) return '—';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;

    const gOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const hOptions = { year: 'numeric', month: 'long', day: 'numeric', calendar: 'islamic-umalqura' };

    const gPart = d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', gOptions);
    const hPart = d.toLocaleDateString(language === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-US-u-ca-islamic-umalqura', hOptions);

    return `${gPart} / ${hPart}`;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, formatDateDual }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
