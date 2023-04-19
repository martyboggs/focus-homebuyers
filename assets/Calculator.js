class Calculator {
	constructor(name, strategies, activeStrategy) {
		this.name = name;
		this.interestType = 'amortized';
		this.strategy = activeStrategy;
		this.strategyNames = {
			wholesale: 'Wholesale',
			'seller-finance': 'Seller Finance',
			'lease-option': 'Lease Option',
			purchase: 'Purchase',
			rent: 'Rent',
			'sell-flip': 'Sell/Flip',
			retail: 'Retail'
		};
		this.strategies = strategies;

		this.calc = $('.' + name);
		this.calc.html(`
		<div>
			<div style="margin-bottom: 8px;"><label>Strategy</label>
			<select name="strategy">
				${this.strategies.reduce((t, v, i) => t + `<option value="${v}">${this.strategyNames[v]}</option>`, '')}
			</select></div>
		</div>

		${this.strategies.reduce((t, v, i) => t + `<div class="${v}">${this.getHtml(v)}</div>`, '')}
		`);

		this.calc.find('[name="strategy"]').change(e => {
			$(this.calc).find('.wholesale, .rent, .purchase, .lease-option, .seller-finance, .sell-flip, .retail').hide();
			this.strategyEl = this.calc.find('.' + e.target.value);
			this.strategyEl.css({display: 'block'});
			this.arv = this.strategyEl.find('[name="arv"]');
			this.pp = this.strategyEl.find('[name="purchase-price"]');
			this.dp = this.strategyEl.find('[name="down-payment"]');
			this.fa = this.strategyEl.find('[name="finance-amount"]');
			this.int = this.strategyEl.find('[name="interest-rate"]');
			this.term = this.strategyEl.find('[name="term-months"]');
			this.amort = this.strategyEl.find('[name="amortized-months"]');
			this.pmt = this.strategyEl.find('[name="payment"]');
			this.principalPerc = this.strategyEl.find('[name="principal-percentage"]');
			this.balloon = this.strategyEl.find('[name="balloon"]');
			this.ltv = this.strategyEl.find('[name="ltv"]');
			this.total = this.strategyEl.find('[name="total"]');
		});
		this.calc.find('[name="strategy"]').val(this.strategy);
		this.calc.find('[name="strategy"]').change();

		this.calc.find('[name="arv"], [name="purchase-price"], [name="down-payment"], [name="finance-amount"]').on('input', e => {
			var ppVal = Number(this.pp.val());
			var dpVal = Number(this.dp.val());
			var faVal = Number(this.fa.val());
			if (!ppVal && !this.pp.is(e.target)) this.pp.val(ppVal);
			if (!dpVal && !this.dp.is(e.target)) this.dp.val(dpVal);
			if (!faVal && !this.fa.is(e.target)) this.fa.val(faVal);
			switch (e.target.name) {
				case 'purchase-price':
					this.fa.val(ppVal - dpVal);
				break;
				case 'down-payment':
					this.fa.val(ppVal - dpVal);
				break;
				case 'finance-amount':
					this.pp.val(faVal + dpVal);
				break;
			}
			this.calculate({className: 'payment'});
			this.calculate({className: 'balloon'});
		});

		this.calc.find('[name^="interest-type-"]').change(e => {
			this.interestType = e.target.value;
			this.strategyEl.find('.amortized-months').css({display: e.target.value === 'amortized' ? 'flex' : 'none'});
			this.strategyEl.find('.principal-percentage').css({display: e.target.value === 'simple' ? 'flex' : 'none'});
			this.calculate({className: 'payment'});
			this.calculate({className: 'balloon'});
		});
		this.calc.find('[type="range"]').each((i, field) => {
			field.addEventListener('input', e => {
				var number = Number(e.target.value);
				e.target.previousSibling.childNodes[0].value = field.className === 'interest-rate-range' ? (number).toFixed(2) : number;
				this.calculate({className: 'payment'});
				this.calculate({className: 'balloon'});
			});
		});

		this.calc.find('[name="interest-rate"], [name="amortized-months"]').each((i, field) => {
			field.addEventListener('input', e => {
				this.calculate({className: 'payment'});
				this.calculate({className: 'balloon'});
			});
		});
		this.calc.find('[name="payment"], [name="term-months"], [name="principal-percentage"]').each((i, field) => {
			// this.principalPerc = (-interest / payment) + 1
			field.addEventListener('input', e => {
				this.calculate({className: 'balloon'}, e);
			});
		});

		this.calc.find('button').each((i, button) => {
			button.addEventListener('click', e => {
				this.calculate(button);
			});
		});
	}

	calculate(button, e) {
		var arvAmt = Number(this.arv.val());
		var finAmt = Number(this.fa.val());
		var monthRate = Number(this.int.val()) / 100 / 12;
		var termMonths = Number(this.term.val());
		var amortMonths = Number(this.amort.val());
		var pmtAmt = Number(this.pmt.val());
		var balloonAmt = Number(this.balloon.val());
		switch (button.className) {
			case 'finance-amount':
				if (balloonAmt) {
					finAmt = !monthRate ? balloonAmt / ((amortMonths - termMonths) / amortMonths) : balloonAmt / ((Math.pow(1 + monthRate, amortMonths) - Math.pow(1 + monthRate, termMonths))/(Math.pow(1 + monthRate, amortMonths) - 1));
					this.fa.val(finAmt.toFixed(2));
				}
			break;
			case 'interest-rate':
			break;
			case 'term-months':
			break;
			case 'payment':
				if (finAmt) {
					if (this.interestType === 'amortized') {
						if (amortMonths) {
							if (monthRate) {
								pmtAmt = finAmt * monthRate * Math.pow(1 + monthRate, amortMonths) / (Math.pow(1 + monthRate, amortMonths) - 1);
							} else {
								pmtAmt = finAmt / amortMonths;
							}
						}
					} else {
						var interest = finAmt * monthRate;
						pmtAmt = -interest / (Number(this.principalPerc.val()) / 100 - 1);
					}
					this.pmt.val(pmtAmt.toFixed(2));
				}
			break;
			case 'balloon':
				if (termMonths === amortMonths) {
					balloonAmt = 0;
				} else if (this.interestType === 'amortized') {
					// balloonAmt = !monthRate ? finAmt * (amortMonths - termMonths) / amortMonths : finAmt * (Math.pow(1 + monthRate, amortMonths) - Math.pow(1 + monthRate, termMonths)) / (Math.pow(1 + monthRate, amortMonths) - 1);
					if (monthRate) {
						balloonAmt = finAmt * Math.pow(1 + monthRate, termMonths) - pmtAmt / monthRate * (Math.pow(1 + monthRate, termMonths) - 1);
					} else {
						balloonAmt = finAmt - pmtAmt * termMonths;
					}
				} else {
					if (pmtAmt) {
						balloonAmt = finAmt - (pmtAmt - finAmt * monthRate) * termMonths;
					} else {
						balloonAmt = finAmt;
					}
				}
				this.balloon.val(balloonAmt.toFixed(2));
				if (arvAmt) {
					this.ltv.val(Math.round(balloonAmt / arvAmt * 100));
				}
			break;
		}

		if (pmtAmt && e && e.target.name === 'payment') {
			if (this.interestType === 'amortized') {
				if (monthRate) {
					amortMonths = Math.log(pmtAmt/(pmtAmt - finAmt * monthRate)) / Math.log(1 + monthRate);
				} else {
					amortMonths = finAmt / pmtAmt;
				}
				this.amort.val(amortMonths.toFixed(2));
			} else {
				var interest = finAmt * monthRate;
				var pp = -100 * interest / pmtAmt + 100;
				this.principalPerc.val(pp.toFixed(2));
				this.principalPerc.previousSibling.value = Math.round(pp);
				// pmtAmt = -interest / (Number(this.principalPerc.val()) / 100 - 1);
				// pmtAmt * ((this.principalPerc.val() / 100) - 1)= -interest;
				// ((this.principalPerc.val() / 100) - 1)= -interest / pmtAmt;
				// this.principalPerc.val() / 100 =  (-interest / pmtAmt) + 1;
				/// simple? set principal %
			}
		}

		if (termMonths === amortMonths || balloonAmt) {
			this.total.val((balloonAmt + Number(this.dp.val()) + (termMonths * pmtAmt)).toFixed(2));
		}
	}

	getHtml(strategy) {
		var htmls = {
			wholesale: `<div><label>Assignment Fee</label><input type="number" name="assignment-fee" min="0" value="10000"></div>`, 

			'sell-flip': `
			<div><label>ARV</label><input type="number" name="arv" min="1"></div>
			<div><label>Purchase Price</label><input type="number" name="purchase-price" min="1"></div>
			<div><label>Marketing Costs</label><input type="number" name="marketing-costs" min="0"></div>
			<div><label>Realtor Costs</label><input type="number" name="realtor-costs" min="0"></div>
			<div><label>Closing Costs</label><input type="number" name="closing-costs" min="0"></div>`,

			rent: `<div><label>Monthly Rents</label><input type="number" name="rents" min="0"></div>
			<div><label>Vacancy Rate</label><span class="input-holder"><input type="number" name="vacancy-rate" min="0"></span></div>`,

			finance: `
			<div><label>ARV</label><input type="number" name="arv" min="1"></div>
			<div><label>Purchase Price</label><input type="number" name="purchase-price" min="1"></div>
			<div><label>Down Payment</label><input type="number" name="down-payment" min="0"></div>
			<div><label>Finance Amount</label><input type="number" name="finance-amount" min="1"></div>
			<div><label>Interest Type</label>
			<input type="radio" name="interest-type-${this.name + '-' + strategy}" value="amortized" id="amortized-${this.name + '-' + strategy}" checked><label for="amortized-${this.name + '-' + strategy}" style="min-width: 0px;">Amortized</label>
			<input type="radio" name="interest-type-${this.name + '-' + strategy}" value="simple" id="simple-${this.name + '-' + strategy}"><label for="simple-${this.name + '-' + strategy}" style="min-width: 0px;">Simple</label>
			</div>
			<div><label>Annual Interest Rate</label><span class="input-holder"><input style="width: 50px;" type="number" min="0" step="0.25" value="2.50"></span><input type="range" min="0" max="10" value="2.50" step="0.25" name="interest-rate" class="interest-rate-range">
			</div>
			<div class="amortized-months"><label>Amortized Months</label><input type="number" name="amortized-months" value="360" min="1">
			</div>
			<div style="display: none;" class="principal-percentage"><label>Principal %</label><span class="input-holder"><input style="width: 50px;" type="number" min="0" value="50"></span><input type="range" min="0" max="99" value="50" name="principal-percentage" class="principal-percentage-range">
			</div>
			<div><label>Payment</label><input type="number" name="payment" min="1">
			</div>
			<div><label>Term Months</label><input type="number" name="term-months" value="96" min="1">
			</div>
			<div>
				<label>Balloon</label><input readonly style="max-width: 95px;" type="number" name="balloon">
				<label style="min-width: 37px;">LTV</label><span class="input-holder readonly"><input style="max-width: 46px;" readonly type="number" name="ltv"></span>
			</div>
			<div><label>Total</label><input readonly type="number" name="total"></div>`,
		};
		if (['seller-finance', 'lease-option', 'purchase'].indexOf(strategy) !== -1) {
			return htmls.finance;
		} else {
			return htmls[strategy];
		}
	}
}