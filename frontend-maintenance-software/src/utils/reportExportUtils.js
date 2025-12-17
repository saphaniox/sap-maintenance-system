// Report Export Utilities for PDF and Word

/**
 * Export production report to PDF
 * @param {Object} report - The production report data
 */
export const exportToPDF = (report) => {
  const printWindow = window.open('', '_blank');
  
  const html = generateReportHTML(report);
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print();
  };
};

/**
 * Export production report to Word (using HTML format)
 * @param {Object} report - The production report data
 */
export const exportToWord = (report) => {
  const html = generateReportHTML(report, true);
  
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Production_Report_${report.imsId}_${new Date(report.reportingPeriod.startDate).toISOString().split('T')[0]}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate HTML content for the report
 * @param {Object} report - The production report data
 * @param {boolean} isWord - Whether this is for Word export
 * @returns {string} - HTML string
 */
const generateReportHTML = (report, isWord = false) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const formatTime = (time) => {
    if (!time) return '00:00';
    const h = String(time.hours || 0).padStart(2, '0');
    const m = String(time.minutes || 0).padStart(2, '0');
    return `${h}:${m}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB');
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Weekly Production Report - ${report.imsId}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 1cm;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 20px;
        }
        
        .report-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          position: relative;
        }
        
        .header-logos {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 40px;
          margin-bottom: 15px;
        }
        
        .header-logos img {
          height: 60px;
          width: auto;
          object-fit: contain;
        }
        
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 18px;
          text-transform: uppercase;
        }
        
        .document-info {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 15px;
          border: 1px solid #ccc;
          padding: 10px;
          background: #f5f5f5;
        }
        
        .document-info div {
          display: flex;
          flex-direction: column;
        }
        
        .document-info label {
          font-weight: bold;
          font-size: 9px;
          text-transform: uppercase;
          color: #666;
        }
        
        .document-info span {
          font-size: 11px;
          margin-top: 3px;
        }
        
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 10px;
          padding: 5px;
          background: #333;
          color: white;
          text-transform: uppercase;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .info-item {
          display: flex;
          border-bottom: 1px dotted #ccc;
          padding: 3px 0;
        }
        
        .info-item label {
          font-weight: bold;
          min-width: 150px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 10px;
        }
        
        table th {
          background: #333;
          color: white;
          padding: 8px 4px;
          text-align: left;
          font-weight: bold;
          border: 1px solid #000;
          font-size: 9px;
        }
        
        table td {
          padding: 6px 4px;
          border: 1px solid #ccc;
          vertical-align: top;
        }
        
        table tbody tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        .operators-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .operators-list li {
          padding: 2px 0;
        }
        
        .operators-list li:before {
          content: "• ";
          font-weight: bold;
        }
        
        .signatures {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-top: 30px;
          page-break-inside: avoid;
        }
        
        .signature-block {
          border: 1px solid #ccc;
          padding: 15px;
          background: #f9f9f9;
        }
        
        .signature-block h4 {
          margin: 0 0 10px 0;
          font-size: 12px;
          text-transform: uppercase;
          border-bottom: 2px solid #333;
          padding-bottom: 5px;
        }
        
        .signature-field {
          margin-bottom: 8px;
        }
        
        .signature-field label {
          display: block;
          font-weight: bold;
          font-size: 9px;
          color: #666;
        }
        
        .signature-field span {
          display: block;
          padding: 3px 0;
          border-bottom: 1px solid #999;
          min-height: 20px;
        }
        
        .summary-box {
          background: #e8f4f8;
          border: 2px solid #0066cc;
          padding: 15px;
          margin: 15px 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-item label {
          display: block;
          font-size: 10px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .summary-item span {
          display: block;
          font-size: 16px;
          font-weight: bold;
          color: #0066cc;
        }
        
        .notes-box {
          border: 1px solid #ccc;
          padding: 10px;
          background: #f9f9f9;
          min-height: 60px;
          white-space: pre-wrap;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-container">
        <!-- Header -->
        <div class="header">
          <div class="header-logos">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAyCAYAAAAZUZThAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuZWRhMmIzZiwgMjAyMS8xMS8xNy0xNzoyMzoxOSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIzLjEgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wMS0xNVQxMDowMDowMCswMzowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDEtMTVUMTA6MzA6MDArMDM6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDEtMTVUMTA6MzA6MDArMDM6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmE3YjhjOTIzLTRkNWItNDY0Zi1iNzg3LTEyMzQ1Njc4OTBhYiIgeG1wTU06RG9jdW1lbnRJRD0i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" alt="TotalEnergies Logo">
            <img src="data:image/png;base64,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1QOGjTo5LBhw07y31fW1NR8UlNTc5D/fvLgwYOVu3btqty/f39lWVlZ5f/+97/K77///uTx48fT7i//dAh26623bj7jjDPWjRkzZh3l1LFjx/4wduzYH8aNG/cDZdS+ffv+P2rUqP+PGDHi/8OHDz9EGXngnnvu+eHuu+8+NGXKlENTp049dPfddx/ieMy49957D3HchziuwwMGDDjUrVu3Q126dDl0/fXXH+rZs+ehTp06HbrmmmtOP/3009tffPHF7Yxltkk/fv311+127Ngx+q677jrQp0+fA5R+P7Rv3/4A5VJ/du7c+QDHc+CKK674/5gxY37g3P/Pc/xh8ODBB/j7gT59+hzgv/+wT/7w+9//ngVbceDtt98+cPDgwQO///3vD3Tu3PlA06ZND3AO//+nP/3pwN///vcD//rXvw48+eSTB5544okDU6dOPfDYY48dmDx58gHu64G77rrrwF133XXgzjvvPHD77bcfuO222w5MnDjxAP89cPPNNx+49dZbD/Cc+evWm246cOONNx7g/H/gN9zPe++998Bdd92lfG/5/e53vzt4//3316l/V3H+Bx9//PED27dvP/DZZ58dmDp16oF77733wOTJkw9Mnjz5wJQpUw5Qxh2YOHHigQkTJhzgWA+MHz/+wNixYw+MGTPmwOjRow+MGjXqQP/+/Q/069fvwLXXXnugT58+B/r06XPg+uuvP3DzzTefePLJJ2tffvllHpv63hf+dAj2xRdf/LJly5ZrunTpsqZNmzZrzjvvvDVnnnnmmtatW6/hONdcd911K/v167eyR48eK6+88soVZ5999orWrVuvoKxYMXTo0BWUY8u7du26vKqqqoz/HpNuUmwOQWFh4ZJ27dot6du375Jhw4Yt6dOnz5Lrr79+Ca8VXrp3775k0KBBS4YMGbKkZ8+eLs/l8ksvvXTxLbfcsvjBBx9c/NBDD7nlhRdeuPiFF15YzP1Y/PTTT1/85JNPLp46deri6dOnL+Z9l82ePfuTlStXfsK7/SeXXXbZos6dOy9q06bNIs710ksvXdS/f/9FPNdFAwYMWHTDDTcsuvHGGxc1a9ZsUdeuXRfxv4s4nkW9e/de1L1790U8J/5r2RVXXLGIPy/iOM7s27fvot/85jeL+O8i/lyV+q2dv/jiiwX8r//Om//69NPff/75CkqN+q393qJv374rKi9++WXKGW+9dd24ceNGjhw5cuRtt902kj8j+TOS++t8lJHjxo0byfEjx44dO3LkyJEjeR6jRo4cOWrkyJHquYwcNWrUKP4MMopSOI7RAwYMGM1z+d/DDz/88YoVKz765JNPPvrwww8/Wr58+UcfffTRR5SRPMdRw4YNG3XLLbeM4rkczbHJ66677miO56hbb731KOd09PrrrzdMnjz58NChQw/36NHjMOczYsOGDYe//PJLHpN6XnXqX/oE+9RTT1Vcc801S/v27btUdy/Xa665ZimvF5YOGDDgk7///e9LOC6V48eP/+Saa65Z+uSTT36y/vXXv1u2bNl3ixYt+k43Zfv27dtOH3Cm7gNzCCgtzjnnnAo7uuiii/b37t17H6/p1l1xxRX7rrvuun28Htl3ww037ONdgH3Dhg3bN2LEiH0PPPDAvgceeGAf79rtmz59+j7+1MYrrrhiz7Jly/YUFRXt2bhx454PP/zwtCNHjuzhjb19//vf/3YfPHhwJ+X7Tvbv7k6dOu3q16/fLopm18iRI3cNGzZs15AhQ3bx+mn3yJEjd/Xv33/3HXfcsfuuu+7azevH3Xfcccfuu+++e/dvf/vb3XffffduitXPfv36HSW/93fv3n33Aw88sFv97vjZZ5/t/vDDDze+//7768/gcaz/6KOPNm7atGnjxx9/vPHDDz/cyPFt/Pjjjzd+8MEHG/kz5bffbfz22283rlmzZuO6des28p7uxq+//nrjihUr1Bhs/e6773ZT9u7q3r37rvPPP38XxbbrnnvuWfP888+vWbdu3Rr9t3bs2LGa1+NrOL+N3MeNP/zww0b+xo0//vjjxi+++GIjz39j2mnTplWeeO+946tXrz6+adOm43JzcuvZlgYVFRU/NW3a9KdLL730p7q6uuNHjhw5vn///uMlJSXHjx07dpz/KNx/55y5t1q+6acznn/++U6ffPJJZz3AtN+5X6fxfE5v165dcf/+/Yu7d+9eP/fLLytmzpx5+rRp0077/e9/f1rPnj1P69279+kPP/zwaQ899NBplNOeeOKJ0+69997TpkyZUk8ZdYxy+mk8htN4PqfxvE5bsmTJaUePHm3M89V/69l++OGH04wqLCw8Y82aNWc899xzZ95+++1nUE4/g/M9g+dwxqhRo87gec3iFe0ZhYWFjXnt38ixnNGqVasz7rjjjjP4b+o3/cYbbzzj7rvvPuP2228/43e/+90Z06dPP+Puu+8+4+677z7jgQceOJNj/PG5555buV2yJ02adKbt8eDFF1+8cvz48WeNHDny7EmTJp3FY8d/M3mtedbkyZPPotSdeUFtbe0v69atO+tEQUH9I488cvbEiRPPHj9+/Nm6acRvucW5U2+eVT9z5tl//OMfz37wwQfP5jWp9pvy+x133HE2r03P5n4Z9v15553N33j2xIkTz+Z1+NnDhg07m+PAv6RXr155++23u+0777yr+8Yb2rZp06bur3/9a93jjz9e9/e//73umWeecY3+nXLKKXUPPvhg3aRJk+qmT59ex2v4ukceeaSO4zft3r1798tff/312ZyjuqeffnrVlClTzubPkdv//vee55133tmXXnppXceOHeuuv/76us8+++xsyjm2c2hv5RwK1L/PG13Xru7WW2+te+CBB+oeffTRuv/85z/m393f+vr6RjzWxu3bt688/fTTz/3tb397LuXcs3kdzGs95dxz7c9D/0Y3O/300+umTp1aN23atLrp06fXTZs2re7xxx+ve+yxx+ruu+++usmTJ+u/vx+lTh1Dv379zt27d+/ZuknY6Pvv/1Ow6u+99/QiStdFixZdMG7cuAt4Hhfwnx09TznllAvOP//8C84999wzLrvssgva6P/H6o9HH330gqlTp57Pdb2A1/D1/Le+jpLD7++/9x//y5//rR/TP/7xj/q5c+fmTZo0qR7vk+P9cvh+OQT07Nmz+b59+5qLzLnHHnuseWlpadP333+/ab9+/Zpef/31Tfv37988Ozv77Pbt2zft0qVL06FDhza9+eabmzZp0kT/3fN45Jgxbdu2rdehQ4cWrVu3bkE5v0W7du3O6NGjx1k8pxYTJ05swf18Q/3rt99+2+Kpp55qwb1v8cgjj0jvu+++Fo888kjz+jffrF++fHlzyo1Gjhw5kkf5EX+rkf49MnbvvHPPhiNHjjSoOnToUEP+NmjQoEFW//4NGl588cWGubm5Dfv37299fX1Dzvkn9Z8PP/xwg/3791N+avDqq682ePfddxusXr26waZNmxqsW7euwZo1axr88MMPDb788ssGy5Yta8B1bfCf//yngW5yNnjnnXfq33333fpnn322fufOnfX//e9/6/fu3dvg66+/rrds2bKG7733XkPuR8Mrrrii4ZVXXvnjL3/5y4bXXXfd/q5du+4fOHDgEd4bbM97hQ2OP/bYYw2OPfZY/d1335312Wef1X/zzTf1S5curd+6dWu9vI+nX7dr165a/ddwbN682fomtX8cgt14443VnOdRjrF23759RziW6qKiopOlpaUndROp+ujRo9Xl5eXV+v3HE/v37z9RUVFR/cMPP1Tv27fvBH+v5u/Vx44dO5GdnV1dW1tbzTlV66Zcte6H1PP3qvz8/Konn3yyatKkSVXTp0+vmjp1atUtt9xSNXny5Kr7779fe59Q/RuEVXFeUvS/MmPGjCqqZWFhYVFxcfHxvLy8Y/q1V4N9+/Yd4zUbrwuPcQ8anXDhWKs5n2rOo1p3m6s5x2rO8dis//V0l1122cnu3bufvP7660/yGq9a/c2tWrVqpW7K1PPeYDV1QPfPaT91HTduXDX/VXvfffedvO+++07Onj37JOet+pVXXjlJ/XHyjjvuOMl5n5w6derJCRMmnOQvZ/9WLViwgP91qz5w4MDJQ4cOnTxx4kT1kSNHGh04cKCh7gY2pO7UN/3QqGHr1q0bXnTRRQ25pw2feOKJhjNmzKifN29e/YwZM+ofeuih+gcffLA+NWj93//+t/6VV16pnzdvXsNXX321/o033mj4yiuv1D/33HP1Tz/9dP28efPqZ86cWf/ggw/WT5o0qZ7y6yNPP11fUFFRv3Tp0vo1a9bUf/TRR/VfffVV/Zo1a+o///zz+s8++6z+888/r//yyy/reY+zfuPGjfW83qzfsGFD/YYNGxp+9913DT/99NOG/H9D/us2+OCDDxosWbKk4dKlS+s//vjj+tWrV9evXr26/vPPP6///PPP61etWvXTp59++pN+f7Gh/ntZw7i0a/jcc8/Vb9my5czc3Nwz9evJM/X9rj/jjDMa6v9+NtQvNxvWvfFGw9q1axtyThruv0J3qxvWrVzZsGH//g1fffXVnxYvXnzy+eefP/nSSy+dnDdv3skFCxacnDt37kn+6ydfeOEF9W/b/xMAAAAQd2vXrv3V1q1bL9y8efOFH3/88a85RxfqN+L//9JLL/11WVnZhUVFRRfy+v3C7du3X7h169YLt2zZwr1qe+Err7wyOBaLZat3AP8PjWzW+8fcLg8AAAAASUVORK5CYII=" alt="Albertine Waste Management">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4xLWMwMDAgNzkuZWRhMmIzZiwgMjAyMS8xMS8xNy0xNzoyMzoxOSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIzLjEgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyNS0wMS0xNVQxMDowMDowMCswMzowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjUtMDEtMTVUMTA6MzA6MDArMDM6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjUtMDEtMTVUMTA6MzA6MDArMDM6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmE3YjhjOTIzLTRkNWItNDY0Zi1iNzg3LTEyMzQ1Njc4OTBhYiIgeG1wTU06RG9jdW1lbnRJRD0i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" alt="TWSA Logo">
          </div>
          <h1>${report.documentTitle || 'WEEKLY PRODUCTION REPORT'}</h1>
          <p>Total Water Services Africa (Uganda) Limited</p>
        </div>
        
        <!-- Document Information -->
        <div class="document-info">
          <div>
            <label>IMS ID:</label>
            <span>${report.imsId}</span>
          </div>
          <div>
            <label>Version:</label>
            <span>${report.version}</span>
          </div>
          <div>
            <label>Issue Date:</label>
            <span>${formatDate(report.issueDate)}</span>
          </div>
          <div>
            <label>Next Review:</label>
            <span>${formatDate(report.nextReview)}</span>
          </div>
        </div>
        
        <!-- Report Information -->
        <div class="section">
          <div class="section-title">Report Information</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Reporting Period:</label>
              <span>${formatDate(report.reportingPeriod.startDate)} to ${formatDate(report.reportingPeriod.endDate)}</span>
            </div>
            <div class="info-item">
              <label>Machine:</label>
              <span>${report.machine?.name || 'N/A'} (${report.machine?.code || 'N/A'})</span>
            </div>
            <div class="info-item">
              <label>TWSA Site:</label>
              <span>${report.site?.name || 'N/A'} (${report.site?.code || 'N/A'})</span>
            </div>
            <div class="info-item">
              <label>Status:</label>
              <span>${report.status?.toUpperCase() || 'DRAFT'}</span>
            </div>
          </div>
        </div>
        
        <!-- Personnel -->
        <div class="section">
          <div class="section-title">Personnel</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Operator(s):</label>
              <ul class="operators-list">
                ${report.operators?.map(op => `<li>${op}</li>`).join('') || '<li>N/A</li>'}
              </ul>
            </div>
            <div class="info-item">
              <label>Operations Manager:</label>
              <span>${report.opsManager || 'N/A'}</span>
            </div>
            <div class="info-item">
              <label>Supervisor:</label>
              <span>${report.supervisor || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <!-- Summary Statistics -->
        <div class="summary-box">
          <div class="summary-item">
            <label>Total Input</label>
            <span>${(report.summary?.totalInput || 0).toLocaleString()} Kg</span>
          </div>
          <div class="summary-item">
            <label>Total Output</label>
            <span>${(report.summary?.totalOutput || 0).toLocaleString()} Kg</span>
          </div>
          <div class="summary-item">
            <label>Efficiency</label>
            <span>${report.summary?.efficiency || 0}%</span>
          </div>
          <div class="summary-item">
            <label>Total Downtime</label>
            <span>${((report.summary?.totalDowntime || 0) / 60).toFixed(1)} hrs</span>
          </div>
        </div>
        
        <!-- Daily Production Data -->
        <div class="section">
          <div class="section-title">Daily Production Data (7 Days)</div>
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Planned<br/>Time</th>
                <th>Start<br/>Time</th>
                <th>Input<br/>(Kg)</th>
                <th>Stop<br/>Time</th>
                <th>Output<br/>(Kg)</th>
                <th>Down-<br/>time</th>
                <th>Used<br/>Time</th>
                <th>Reason for Stopping</th>
                <th>Action Taken</th>
              </tr>
            </thead>
            <tbody>
              ${report.dailyProduction?.map((day, index) => `
                <tr>
                  <td><strong>${daysOfWeek[index]}</strong></td>
                  <td>${formatDate(day.date)}</td>
                  <td>${formatTime(day.plannedTime)}</td>
                  <td>${formatTime(day.startTime)}</td>
                  <td>${(day.input || 0).toLocaleString()}</td>
                  <td>${formatTime(day.stopTime)}</td>
                  <td><strong>${(day.output || 0).toLocaleString()}</strong></td>
                  <td>${formatTime(day.downtime)}</td>
                  <td>${formatTime(day.usedTime)}</td>
                  <td>${day.reason || '-'}</td>
                  <td>${day.actionTaken || '-'}</td>
                </tr>
              `).join('') || '<tr><td colspan="11">No daily production data</td></tr>'}
            </tbody>
          </table>
        </div>
        
        <!-- Machine Inspections -->
        ${report.machineInspections && report.machineInspections.length > 0 ? `
          <div class="section">
            <div class="section-title">Daily Machine Inspections</div>
            <table>
              <thead>
                <tr>
                  <th>Date of Inspection</th>
                  <th>Observation Made</th>
                  <th>Support Required</th>
                  <th>Reported to Who?</th>
                  <th>Date of Reporting</th>
                  <th>Support Given</th>
                </tr>
              </thead>
              <tbody>
                ${report.machineInspections.map(inspection => `
                  <tr>
                    <td>${formatDate(inspection.dateOfInspection)}</td>
                    <td>${inspection.observationMade || '-'}</td>
                    <td>${inspection.supportRequired || '-'}</td>
                    <td>${inspection.reportedToWho || '-'}</td>
                    <td>${formatDate(inspection.dateOfReporting)}</td>
                    <td>${inspection.supportGiven || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <!-- Additional Notes -->
        ${report.notes ? `
          <div class="section">
            <div class="section-title">Additional Notes</div>
            <div class="notes-box">${report.notes}</div>
          </div>
        ` : ''}
        
        <!-- Signatures -->
        <div class="section">
          <div class="section-title">Approvals & Signatures</div>
          <div class="signatures">
            <div class="signature-block">
              <h4>Operator</h4>
              <div class="signature-field">
                <label>Name:</label>
                <span>${report.signatures?.operator?.name || ''}</span>
              </div>
              <div class="signature-field">
                <label>Position:</label>
                <span>${report.signatures?.operator?.position || ''}</span>
              </div>
              <div class="signature-field">
                <label>Date:</label>
                <span>${formatDate(report.signatures?.operator?.date)}</span>
              </div>
              <div class="signature-field">
                <label>Signature:</label>
                <span>${report.signatures?.operator?.signature || ''}</span>
              </div>
            </div>
            
            <div class="signature-block">
              <h4>Supervisor</h4>
              <div class="signature-field">
                <label>Name:</label>
                <span>${report.signatures?.supervisor?.name || ''}</span>
              </div>
              <div class="signature-field">
                <label>Position:</label>
                <span>${report.signatures?.supervisor?.position || ''}</span>
              </div>
              <div class="signature-field">
                <label>Date:</label>
                <span>${formatDate(report.signatures?.supervisor?.date)}</span>
              </div>
              <div class="signature-field">
                <label>Signature:</label>
                <span>${report.signatures?.supervisor?.signature || ''}</span>
              </div>
            </div>
            
            <div class="signature-block">
              <h4>Manager</h4>
              <div class="signature-field">
                <label>Name:</label>
                <span>${report.signatures?.manager?.name || ''}</span>
              </div>
              <div class="signature-field">
                <label>Position:</label>
                <span>${report.signatures?.manager?.position || ''}</span>
              </div>
              <div class="signature-field">
                <label>Date:</label>
                <span>${formatDate(report.signatures?.manager?.date)}</span>
              </div>
              <div class="signature-field">
                <label>Signature:</label>
                <span>${report.signatures?.manager?.signature || ''}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; font-size: 9px; color: #666; border-top: 1px solid #ccc; padding-top: 10px;">
          <p>Generated on ${new Date().toLocaleString('en-GB')} | ${report.imsId} ${report.version}</p>
          <p>Total Water Services Africa (Uganda) Limited - Production Report</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
