const ExcelJS = require('exceljs');

class ExcelWorkbook {
    constructor(creator, initData={}, url='') {
        this.creator = creator;
        this.initData = initData;
        this.url = url || process.env.PAGE_URL;

        this.fileName = `pagespeed-results.xlsx`;
        this.workbook = new ExcelJS.Workbook();
    }

    async initWorkbook() {
        try {
            await this.workbook.xlsx.readFile(this.fileName);
        } catch (err) {
            
        }
        
        // if workbook exists
        if (this.workbook.worksheets.length > 0) {
            if (this.initData) {
                const totalElementCell = this.workbook.worksheets[0].getCell('B3');
                const endTimeCell = this.workbook.worksheets[0].getCell('B5');

                totalElementCell.value = this.initData.totalElems;
                endTimeCell.value = this.initData.endTime;
            }
            return;
        };
    
        // set workbook properties
        this.workbook.creator = this.creator;
        this.workbook.created = new Date();
    
        const sheet = this.workbook.addWorksheet('PageSpeed Test Results');
    
        // set information box
        const rowData = [
            ['Client URL: ', this.url],
            ['Repo ID: ', this.repoID],
            ['Num of Test Elements: ', this.initData.totalElems || ''],
            ['Start Time: ', this.initData.startTime || ''],
            ['End Time: ', this.initData.endTime || ''],
            ['Test Duration: ', 'WIP'],
            [' ', ' '],
        ]
        sheet.addRows(rowData);
    };

    async saveWorkbookAsFile() {
        await this.workbook.xlsx.writeFile(this.fileName);
    };

    addNewSection(elementType='', elementSource='') {
        const sheet = this.workbook.worksheets[0];
        sheet.addRow([' ']); // Add spacers
        sheet.addRow([' ']); // Add spacers

        sheet.addRow(['Element Type: ', elementType]);
        sheet.addRow(['Element Source: ', elementSource]);
        
        const metricRowNum = sheet.addRow([
            ' ',
            'First Contentful Paint', ' ', ' ',
            'Speed Index', ' ', ' ',
            'Time To Interactive', ' ', ' ',
            'First Meaningful Paint', ' ', ' ',
            'First CPU Idle', ' ', ' ',
            'Estimated Input Latency', ' ', ' ',
        ]).number;
        sheet.mergeCells(`B${metricRowNum}`, `D${metricRowNum}`);
        sheet.getCell(`B${metricRowNum}`).alignment = { horizontal: 'center' };
        sheet.mergeCells(`E${metricRowNum}`, `G${metricRowNum}`);
        sheet.getCell(`E${metricRowNum}`).alignment = { horizontal: 'center' };
        sheet.mergeCells(`H${metricRowNum}`, `J${metricRowNum}`);
        sheet.getCell(`H${metricRowNum}`).alignment = { horizontal: 'center' };
        sheet.mergeCells(`K${metricRowNum}`, `M${metricRowNum}`);
        sheet.getCell(`K${metricRowNum}`).alignment = { horizontal: 'center' };
        sheet.mergeCells(`N${metricRowNum}`, `P${metricRowNum}`);
        sheet.getCell(`N${metricRowNum}`).alignment = { horizontal: 'center' };
        sheet.mergeCells(`Q${metricRowNum}`, `S${metricRowNum}`);
        sheet.getCell(`Q${metricRowNum}`).alignment = { horizontal: 'center' };

        sheet.addRow([
            'Test #',
            'Score', 'Display Value (s)', 'Numeric Value (ms)',
            'Score', 'Display Value (s)', 'Numeric Value (ms)',
            'Score', 'Display Value (s)', 'Numeric Value (ms)',
            'Score', 'Display Value (s)', 'Numeric Value (ms)',
            'Score', 'Display Value (s)', 'Numeric Value (ms)',
            'Score', 'Display Value (s)', 'Numeric Value (ms)',
        ]).alignment = { horizontal: 'center' };
    };

    addDataRow(elementData) {
        const sheet = this.workbook.worksheets[0];
        sheet.addRow(elementData).alignment = { horizontal: 'center' };
    };
};

exports.ExcelWorkbook = ExcelWorkbook;
