import { data as locationData } from '$lib/store.js';
import { get } from 'svelte/store';

/*Functions*/

function calcVal(f, s){
	let first = parseFloat(f) || 0;
	let second = parseFloat(s) || 0;

	if(first == 0 && second == 0) { return 0; }
	if(first == 0 && second != 0) { return Math.sign(first); }
	if(first != 0 && second == 0) { return Math.sign(first); }
	if(first != 0 && second != 0) { return (first/second); }
}
function gaurd(denom, expr){
	if(denom == 0){ return 0; }
	return expr;
}
// ****************************************************************************
// *                             Update Summations                            *
// ****************************************************************************
export function update(){
	let dt = get(locationData);
	//console.log("Loading Relationships");
	//console.log(dt);
	
	// ****************************************************************************
	// *                                 Sum rows                                 *
	// ****************************************************************************

	Object.entries(dt.data.tables).forEach(([table_name, table] ) => { // for each table
		Object.entries(table.columns).forEach(([name, col]) => { col.sum = 0; /*console.log(`Resetting ${table_name} ${name} : ${JSON.stringify(col)}`);*/}); // Reset summations
		
		// Parse float may not be nessasary
		Object.values(table.rows).forEach(row => {
			if(row.details){ // sum details
				row.cells[row.cells.length - 1].value = 0; // Reset sum
				Object.values(row.details).forEach((detail) => { // Sum entries
					row.cells[row.cells.length - 1].value += parseFloat(detail.value) || 0;
				});
			}

			if(table.columns.gross && !row.preventSum ){ // sum gross
				table.columns.gross.sum += parseFloat(row.cells[row.cells.length - 2].value) || 0;
			}
			
			if(table.columns.net_adjusted && !row.preventSum){// sum netadjusted
				table.columns.net_adjusted.sum += parseFloat(row.cells[row.cells.length - 1].value) || 0;
			}
			
			if(table.columns.gross_yield && !row.preventSum){// sum grossYield
				table.columns.gross_yield.sum += parseFloat(row.cells[0].value) || 0;
			}
		
			dt.data.tables.fixed_expenses.rows.principals_salary_benefits.details[13].value = gaurd(dt.data.tables.services.rows.total_practice_yield.cells[5].value, (dt.data.tables.services.rows.associates_services.cells[5].value * (dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[5].value/dt.data.tables.services.rows.total_practice_yield.cells[5].value))*0.1);

		});
	});



	// ****************************************************************************
	// *                           Special Calculations                           *
	// ****************************************************************************

	/**
	 * Lookup table of cells
	 * 
	 * F73 = total practice receipts net adjusted
	 * F71 = total practice yield net adjusted
	 * F68 = services.associates_services net adjusted
	 * F197 = total operating expenses net adjusted
	 * 
	 * */
	// Total Practice Yield
	//console.log("gross: " + dt.data.tables.services.columns.gross.sum)
	dt.data.tables.services.rows.total_practice_yield.cells[4].value = dt.data.tables.services.columns.gross.sum;
	
	dt.data.tables.services.rows.total_practice_yield.cells[5].value = dt.data.tables.services.columns.net_adjusted.sum;

	// Total Practice Receipts netYield
	dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[2].value = calcVal(dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[5].value,dt.data.tables.services.rows.total_practice_yield.cells[5].value);

	// Total Practice Receipts grossYield
	dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[0].value = calcVal(dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[5].value,dt.data.tables.services.rows.total_practice_yield.cells[4].value);

	// Total Practice Receipts netadjusted
	dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[4].value = calcVal(dt.data.tables.services.rows.total_practice_yield.cells[4].value - dt.data.tables.services.rows.total_practice_yield.cells[5].value,dt.data.tables.services.rows.total_practice_yield.cells[4].value);

	dt.data.tables.fixed_expenses.rows.net_operating_income.cells[4].value = dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[5].value 
																	- ( dt.data.tables.variable_expenses.columns.net_adjusted.sum + dt.data.tables.fixed_expenses.columns.net_adjusted.sum );//F73-F197

	dt.data.tables.fixed_expenses.rows.net_operating_income.cells[0].value = 1 - (dt.data.tables.variable_expenses.columns.gross_yield.sum + dt.data.tables.fixed_expenses.columns.gross_yield.sum);
	
	dt.data.tables.fixed_expenses.rows.net_operating_income.cells[2].value = calcVal(dt.data.tables.fixed_expenses.rows.net_operating_income.cells[4].value, dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[5].value); // % NetRecipt
	
	/////////////
	// Profit
	/////////////
	let totalNonOperatingNetAdjusted = dt.data.tables["non-operating_expenses"].columns.net_adjusted.sum - (2 * dt.data.tables["non-operating_expenses"].rows.other_income.cells[4].value);

	//console.log(dt.data.tables.services.rows.total_practice_yield.cells[4].value);

	dt.data.tables["non-operating_expenses"].rows.profit.cells[0].value = dt.data.tables.fixed_expenses.rows.net_operating_income.cells[0].value 
		- calcVal( totalNonOperatingNetAdjusted,
			dt.data.tables.services.rows.total_practice_yield.cells[4].value);

	dt.data.tables["non-operating_expenses"].rows.profit.cells[4].value = dt.data.tables.fixed_expenses.rows.net_operating_income.cells[4].value - totalNonOperatingNetAdjusted;

	dt.data.tables["non-operating_expenses"].rows.profit.cells[2].value = calcVal(dt.data.tables["non-operating_expenses"].rows.profit.cells[4].value, dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[5].value); // % NetRecipt
	
	// Operating Efficiency
	dt.data.misc.operating_efficiency.net_adjusted = dt.data.tables.fixed_expenses.rows.net_operating_income.cells[4].value + dt.data.tables.fixed_expenses.rows.principals_salary_benefits.cells[4].value;

	dt.data.misc.operating_efficiency.percent = gaurd(dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[5].value,
		(dt.data.misc.operating_efficiency.net_adjusted / dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[5].value)
		/ (1 - (dt.data.tables.services.rows.associates_services.cells[5].value / dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[5].value))
	);

	//console.log(`Opperating Effieceny Net Adjusted: ${dt.data.misc.operating_efficiency.net_adjusted}\nOpperating Efficiency Percent: ${dt.data.misc.operating_efficiency.percent}`);
	
	dt.data.tables.statistics.rows.hygiene_salary_benefits_services.cells[0].value = calcVal(dt.data.tables.variable_expenses.rows.hygiene_salary_benefits.cells[4].value, dt.data.tables.services.rows.hygienists_services.cells[4].value);

	dt.data.tables.statistics.rows.hygiene_salary_benefits_services.cells[1].value = calcVal(dt.data.tables.variable_expenses.rows.hygiene_salary_benefits.cells[4].value, dt.data.tables.services.rows.hygienists_services.cells[5].value);
	
	//dt.data.tables.statistics.rows.hygiene_salary_benefits_services.cells[2].value = "Hygiene Salary & Benefits/ Hygiene Services";
	
	let x58 = calcVal(dt.data.tables.variable_expenses.rows.associate_salary_benefits.cells[4].value, dt.data.tables.services.rows.associates_services.cells[5].value);
	
	
	dt.data.misc.potential_increase.net_adjusted = 	(dt.data.tables.services.rows.principal_services.cells[4].value - dt.data.tables.services.rows.principal_services.cells[5].value)
										+ ( 
											(dt.data.tables.services.rows.associates_services.cells[4].value - dt.data.tables.services.rows.associates_services.cells[5].value) 
											* x58 )
										+ (
											((dt.data.tables.services.rows.hygienists_services.cells[4].value - dt.data.tables.services.rows.hygienists_services.cells[5].value) * (1 - dt.data.tables.statistics.rows.hygiene_salary_benefits_services.cells[0].value)) 
											+ dt.data.misc.operating_efficiency.net_adjusted
											);
	
	dt.data.misc.potential_increase.percent = gaurd(dt.data.misc.operating_efficiency.net_adjusted, (dt.data.misc.potential_increase.net_adjusted - dt.data.misc.operating_efficiency.net_adjusted) / dt.data.misc.operating_efficiency.net_adjusted);
	
	//console.log(`a: ${dt.data.tables.services.rows.associates_services.cells[4].value} b: ${dt.data.tables.services.rows.total_practice_yield.cells[4].value}`);
	//console.log(calcVal(dt.data.tables.services.rows.associates_services.cells[4].value, dt.data.tables.services.rows.total_practice_yield.cells[4].value));
	let denomOppPot = (1 - calcVal(dt.data.tables.services.rows.associates_services.cells[4].value, dt.data.tables.services.rows.total_practice_yield.cells[4].value));
	if(denomOppPot == 0){ dt.data.misc.operating_efficiency_potential = 1; }
	else{
		dt.data.misc.operating_efficiency_potential = (dt.data.tables.fixed_expenses.rows.principals_salary_benefits.cells[0].value + dt.data.tables.fixed_expenses.rows.net_operating_income.cells[0].value ) 
		/ denomOppPot;
	}
	//console.log(`Potential Increase Net Adjusted: ${dt.data.misc.potential_increase.net_adjusted}\nPotential Increase Percent: ${potentialIncreasePercent}`);
	// ****************************************************************************
	// *                      % Net Adjusted & % Gross Yield                      *
	// ****************************************************************************
	let totalPracticeYield_Gross = dt.data.tables.services.rows.total_practice_yield.cells[4].value;
	
	Object.entries(dt.data.tables).forEach(([table_name, table] )=> { // for each table
		Object.values(table.rows).forEach(row => {	// for each row
			//console.log(row.cells[2].value);
			if(table_name == "services"){
				row.cells[0].value = calcVal(row.cells[4].value, totalPracticeYield_Gross); // % Gross
				row.cells[2].value = calcVal(row.cells[row.cells.length - 1].value, dt.data.tables.services.rows.total_practice_yield.cells[5].value); // % NetRecipt
			}else{
				if(row.cells[0].value != null && !row.preventSum){
					row.cells[0].value = calcVal(row.cells[row.cells.length - 1].value, totalPracticeYield_Gross); // % Gross
				}
				if(row.cells[2].value != null && !row.preventSum){
					row.cells[2].value = calcVal(row.cells[row.cells.length - 1].value, dt.data.tables.total_practice_receipts.rows.total_practice_yield.cells[5].value); // % NetRecipt
				}
			}
		});
	});


	locationData.set(dt);
}

