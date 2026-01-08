-- Create universities table
CREATE TABLE IF NOT EXISTS public.universities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    branch_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    physical_address TEXT,
    postal_address TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    contact_person TEXT,
    vice_chancellor TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for authenticated users
CREATE POLICY "Allow public read access" ON public.universities
    FOR SELECT TO authenticated USING (true);

-- Insert University Data
INSERT INTO public.universities (id, name, bank_name, account_number, branch_code, account_name, physical_address, postal_address, website, email, phone, contact_person, vice_chancellor)
VALUES
    ('cput', 'Cape Peninsula University of Technology', 'ABSA', '4053548487', '632005', 'Cape Peninsula University of Technology', 'CPUT Bellville Campus, Admin Building, 2nd Floor, Symphony Way, Off Modderdam Road, BELLVILLE, 7535', 'P O Box 1906, BELLVILLE, 7535', 'www.cput.ac.za', 'haupth@cput.ac.za', '021-9596201', 'Hilda Haupt', 'Dr C Nhlapo (Chris)'),
    ('cut', 'Central University of Technology', 'FNB', '62684987418', '210554', 'Central University of Technology FS Student Fee Account', '20 President Brand Street, Mahabane Building, 1St Floor, Bloemfontein, 9301', 'Private Bag X20539, BLOEMFONTEIN, 9300', 'www.cut.ac.za', 'sleeu@cut.ac.za', '051-5073001', 'Sandra Leeu', 'Prof H De Jager (Henk)'),
    ('dut', 'Durban University of Technology', 'Standard Bank', '050505416', '040126', 'Durban University of Technology', 'Milena Court, Gate 1, 79 Steve Biko Road, Steve Biko Campus, DURBAN, 4001', 'P O Box 1334, DURBAN, 4000', 'www.dut.ac.za', 'sushim@dut.ac.za', '031-3732474', 'Sushila Moodley', 'Prof T Mthembu (Thandwa)'),
    ('mut', 'Mangosuthu University of Technology', 'ABSA', '4063827633', '634926', 'Mangosuthu University of Technology', 'West Wing, Mangosuthu Highway, UMLAZI, 4031', 'P O Box 12363, JACOBS, 4026', 'www.mut.ac.za', 'adsecretary@mut.ac.za', '031-907 7219', 'Ritta', 'Prof D Malaza (Duma)'),
    ('nmu', 'Nelson Mandela University', 'Standard Bank', '0800012345', '051001', 'NMU Student Accounts', 'Main Building, 18th Floor, Room 1801, NMMU South Campus, University Road, SUMMER STRAND, PORT ELIZABETH, 6001', 'PO Box 77000, PORT ELIZABETH, 6031', 'www.nmu.ac.za', 'Babalwa.shushu@mandela.ac.za', '041-504 3211', 'Babalwa Shushu', 'Prof S Muthwa (Sibongile)'),
    ('nwu', 'North-West University', 'ABSA', '4070100351', '632005', 'North-West University', 'Joon van Rooyen Building, 11 Hoffman Street, POTCHEFSTROOM, 2521', 'Private Bag X6001, POTCHEFSTROOM, 2520', 'www.nwu.ac.za', 'lerato.tsagae@nwu.ac.za', '018-2994901', 'Lerato Tsagae', 'Prof D Kgwadi (Dan)'),
    ('ru', 'Rhodes University', 'FNB', '62145504553', '210717', 'Rhodes University Student Fees', 'Rhodes University, Main Administration Building, Drostdy Road, GRAHAMSTOWN, 6139', 'PO Box 94, GRAHAMSTOWN, 6140', 'www.ru.ac.za', 'm.burger@ru.ac.za', '046-603 8148', 'Michelle Burger', 'Prof S Mabizela (Sizwe)'),
    ('smu', 'Sefako Makgatho Health & Sciences University', 'Standard Bank', '071244395', '020909', 'Sefako Makgatho Health Sciences University', 'Medunsa, 0204', 'PO Box 203, Medunsa, 0204', 'www.smu.ac.za', 'erica.ehlers@smu.ac.za', '012 302 2002', 'Erica Ehlers', 'Prof C de Beer (Chris)'),
    ('spu', 'Sol Plaatje University', 'FNB', '62516049873', '230102', 'Sol Plaatje University', 'North Campus, Chapel Street, Kimberley', 'Private Bag X5008, Kimberley, 8300', 'www.spu.ac.za', 'yumna.mdutoit@spu.ac.za', '+27 53 491 0120', 'Ms Yumna Moodaley-du Toit', 'Prof Y Ballim (Yunus)'),
    ('sun', 'Stellenbosch University', 'Standard Bank', '0730060000', '051001', 'SU Student Fees', 'Admin Building B, Victoria Street, STELLENBOSCH, 7602', 'Private Bag X1, MATIELAND, 7602', 'www.sun.ac.za', 'wkok@sun.ac.za', '021-8084490', 'Wildre Kok', 'Prof W de Villiers (Wim)'),
    ('tut', 'Tshwane University of Technology', 'ABSA', '4053142603', '632005', 'Tshwane University of Technology', 'Building 21, 5th Floor, Room 556, Staatsartillery Road, PRETORIA-WEST, 0183', 'Private Bag X680, PRETORIA, 0001', 'www.tut.ac.za', 'vanderlindeme@tut.ac.za', '012-3824112', 'Elizma van der Linde', 'Prof L van Staden (Lourens)'),
    ('uct', 'University of Cape Town', 'Standard Bank', '270600035', '025009', 'UCT No. 5 Account Student Fees', 'Bremner Building, Lovers Lane, RONDEBOSCH, 7701', 'Private Bag, RONDEBOSCH, 7701', 'www.uct.ac.za', 'deborah.hendricks@uct.ac.za', '021-6502105', 'Deborah Hendricks', 'Dr M Price (Max)'),
    ('ufh', 'University of Fort Hare', 'Standard Bank', '282101357', '050119', 'University of Fort Hare Student', 'ALICE, 5700', 'Private Bag X1314, ALICE, 5700', 'www.ufh.ac.za', 'kgola@ufh.ac.za', '040-6022071', 'Khanyisa Gola', 'Prof S Buhlungu (Sakhela)'),
    ('ufs', 'University of the Free State', 'ABSA', '1570151688', '630734', 'UFS Student Accounts (Tuition Fees)', 'Main Building H11, Nelson Mandela Drive, Brandwag, BLOEMFONTEIN, 9301', 'PO Box 339, BLOEMFONTEIN, 9300', 'www.ufs.ac.za', 'rectorsoffice@ufs.ac.za', '051-4017000', 'Rhoda Grobler', 'Prof F Petersen (Francis)'),
    ('uj', 'University of Johannesburg', 'FNB', '62615873199', '210554', 'UJ Tuition Fee', '1st Floor, Madibeng Building, Cnr Kingsway and University Road, Kingsway Campus, AUCKLAND PARK, 2006', 'PO Box 524, AUCKLAND PARK, 2006', 'www.uj.ac.za', 'Thabom@uj.ac.za', '011-559 4805', 'Thabo Mamabolo', 'Prof T Marwala (Tshilidzi)'),
    ('ukzn', 'University of KwaZulu-Natal', 'Standard Bank', '053081072', '045426', 'University of KwaZulu-Natal', '1st Floor Admin Building, Chiltern Hill, University Road, WESTVILLE, 3629', 'Private Bag X54001, DURBAN, 4041', 'www.ukzn.ac.za', 'Reddyj1@ukzn.ac.za', '031-2602227', 'Ms Julie Reddy', 'Prof A van Jaarsveld (Albert)'),
    ('ul', 'University of Limpopo', 'Standard Bank', '030131405', '051001', 'University of Limpopo', 'A Block, 4th Floor, Mankweng, SOVENGA, 0727', 'Private Bag X1106, SOVENGA, 0727', 'www.ul.ac.za', 'frances.pratt@ul.ac.za', '015-2682140', 'Frances Pratt', 'Prof NM Mokgalong (Mahlo)'),
    ('ump', 'Mpumalanga University', 'Standard Bank', '032610688', '052852', 'University of Mpumalanga – Student Account', 'Mbombela, 1200', 'Private Bag X11283, Mbombela, 1200', 'www.ump.ac.za', 'Nozuko.ngqukana@ump.ac.za', '013 002 0011', 'Nozuko Ngqukana', 'Prof T Mayekiso (Thoko)'),
    ('unisa', 'University of South Africa', 'FNB', '62799630382', '210554', 'Unisa Student Deposits', 'OR Tambo Building, 13th Floor, Office 15, Preller Street, Muckleneuk Ridge, PRETORIA, 0001', 'PO Box 392, PRETORIA, 0003', 'www.unisa.ac.za', 'Moganma@unisa.ac.za', '012-4292550', 'Linky Mogano', 'Prof MS Makhanya (Mandla)'),
    ('up', 'University of Pretoria', 'ABSA', '2140000054', '632005', 'University of Pretoria', 'Lynnwood Road, Admin Building 433, University of Pretoria, PRETORIA, 0002', 'Private Bag X20, Hatfield, 0028', 'www.up.ac.za', 'Diana.Cochrane@up.ac.za', '012-4202900', 'Diana Cochrane-Van Eeden', 'Prof C de la Rey (Cheryl)'),
    ('uwc', 'University of the Western Cape', 'ABSA', '4049604740', '560810', 'STUDENT DEPOSITS', 'Rectors Office, 3rd Floor, Admin Building, Modderdam Road, BELLVILLE, 7535', 'Private Bag X17, BELLVILLE, 7535', 'www.uwc.ac.za', 'bhendricks@uwc.ac.za', '021-9592101', 'Beulah Hendricks', 'Prof T Pretorius (Tyrone)'),
    ('univen', 'University of Venda', 'ABSA', '1000000589', '334149', 'University of Venda', 'Admin Block, Office 4, University of Venda, Mphephu Street, THOHOYANDOU, 0950', 'Private Bag X5050, THOHOYANDOU, 0950', 'www.univen.ac.za', 'ester.munano@univen.ac.za', '015-9628316', 'Esther Munano', 'Prof JC Crafford (Jan)'),
    ('unizulu', 'University of Zululand', 'ABSA', '1880000051', '632005', 'University of Zululand', 'Admin Building, 4th floor, Anne Cooke Drive, KWADLANGEZWA', 'Private Bag X1001, Kwa-Dlangezwa, 3886', 'www.unizulu.ac.za', 'bhengun@unizulu.ac.za', '035-9026634', 'Mpume Bhengu', 'Prof X Mtose (Xoliswa)'),
    ('vut', 'Vaal University of Technology', 'ABSA', '4068126832', '632005', 'Vaal University of Technology', 'A Block, Cnr, Andries Potgieter Boulevard & Barrage Road, VANDERBIJLPARK, 1911', 'Private Bag X021, VANDERBIJLPARK, 1911', 'www.vut.ac.za', 'gapenyanes@vut.ac.za', '016-9509215', 'Gapenyane Secwalo', 'Prof NG Zide (Gordon)'),
    ('wits', 'University of the Witwatersrand', 'FNB', '62270551015', '210554', 'University of the Witwatersrand', 'Senate House Building, 11th Floor, 3 Jorrison Street, BRAAMFONTEIN, 2017', 'Private Bag 3, WITS, 2050', 'www.wits.ac.za', 'sammy.masehe1@wits.ac.za', '011-7171101', 'Sammy Masehe', 'Prof A Habib (Adam)'),
    ('wsu', 'Walter Sisulu University', 'FNB', '52640012812', '210521', 'WSU Student Fees Account', 'Nelson Mandela Drive, MTHATHA, 5117', 'Private Bag X1, UMTATA', 'www.wsu.ac.za', 'vc@wsu.ac.za', '047-5312267', 'Shamima Dhunraj', 'Prof J Midgely (John)')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    bank_name = EXCLUDED.bank_name,
    account_number = EXCLUDED.account_number,
    branch_code = EXCLUDED.branch_code,
    account_name = EXCLUDED.account_name,
    physical_address = EXCLUDED.physical_address,
    postal_address = EXCLUDED.postal_address,
    website = EXCLUDED.website,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    contact_person = EXCLUDED.contact_person,
    vice_chancellor = EXCLUDED.vice_chancellor,
    updated_at = now();
