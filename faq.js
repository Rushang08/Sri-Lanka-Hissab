function faqCreditItems(m){
 const items=[['Own flight',m.flight],['Own ₹15,000 carry cash',m.cash]];
 data.general.filter(e=>e.paidBy===m.name&&!['FLIGHTS','CASH'].includes(e.id)).forEach(e=>items.push([esc(e.description),e.amount]));
 const card=data.scapia.filter(e=>e.paidBy===m.name&&e.settlement!=='Pranav separate');
 if(card.length)items.push([`${card.length} Scapia card purchases shared with the group`,card.reduce((s,e)=>s+e.amount,0)]);
 const own=data.scapia.filter(e=>e.settlement==='Pranav separate');
 if(m.name==='Pranav'&&own.length)items.push([`${own.length} personal Scapia purchases (repaid separately to Rushang)`,own.reduce((s,e)=>s+e.amount,0)]);
 return items;
}
function faqCostItems(m){
 return [['Own flight',m.flight],['Own ₹15,000 carry cash',m.cash],['Shared bills (Surati food, villas, Dmart, airport cabs)',m.generalShare],['Kandy room allocation',m.kandy],['Scapia purchases',m.scapia],['Return-home cab shares',m.homeShare],['Extra cash exchange shares',m.extraCashShare],['PickMe cab shares',m.pickmeShare],['Shared cash payment',m.cashExpenseShare],['Very personal expenses',m.personalShare],['Pooled cash adjustment (personal use − equal credit)',-m.poolNet]].filter(([,a])=>Math.abs(a)>0.001);
}
function faqPersonAnswer(m){
 const g=m.groupNet,abs=money(Math.abs(g)),extra=m.credit-m.flight-m.cash,shared=m.expense-m.flight-m.cash;
 const n=m.name,why=g>=0?`Because ${n} paid in ${money(m.credit)} but ${n}’s share of the trip is only ${money(m.expense)}. The extra ${abs} was paid for the group, so the group pays it back to ${n}.`:`Because ${n}’s share of the trip is ${money(m.expense)} but ${n} paid in only ${money(m.credit)}. The ${abs} gap was covered by other people, so ${n} pays it to the group.`;
 const sep=m.separateDebt?`<p>Separately, ${n} owes Rushang ${money(m.separateDebt)}. That is <strong>not</strong> part of the number above. See “Separate repayments to Rushang” below.</p>`:m.name==='Rushang'?`<p>Separately, Pankaj and Pranav owe Rushang ${money(data.separateTotal)} in total. That is <strong>not</strong> part of the number above.</p>`:'';
 return `<p class="faq-lead">${why}</p><p>${n}’s flight and ₹15,000 cash appear on both sides and cancel out. What really decides the balance is the shared bills ${n} paid (${money(extra)}) against ${n}’s share of shared costs (${money(shared)}): ${money(extra)} − ${money(shared)} = ${money(g)}.</p><div class="faq-cols"><div><h4>What ${n} paid in</h4>${faqCreditItems(m).map(([l,a])=>line(l,a)).join('')}${line('Total paid in',m.credit,'','total')}</div><div><h4>${n}’s share of the trip</h4>${faqCostItems(m).map(([l,a])=>line(l,a)).join('')}${line('Total share',m.expense,'','total')}</div></div><p><strong>${money(m.credit)} − ${money(m.expense)} = ${money(g)}</strong>, so ${n} ${g>=0?'receives':'pays'} ${abs}.</p>${sep}<button class="text-button" data-person="${m.name}">See ${m.name}’s full calculation ${ico('arrow')}</button>`;
}
function faqSections(){
 const G=Object.fromEntries(data.general.map(e=>[e.id,e])),M=Object.fromEntries(data.members.map(m=>[m.name,m]));
 const recv=data.members.filter(m=>m.groupNet>0),pay=data.members.filter(m=>m.groupNet<0);
 const sum=a=>a.reduce((s,m)=>s+Math.abs(m.groupNet),0);
 const own=data.scapia.filter(e=>e.settlement==='Pranav separate'),ownTotal=own.reduce((s,e)=>s+e.amount,0);
 const names=a=>a.map(m=>m.name).join(', ');
 const cats=[['Flights',G.FLIGHTS.amount],['Carry cash + extra personal cash',G.CASH.amount+data.extraCashTotal],['Villa stays',G.S02.amount+G.S03.amount+G.S04.amount+G.S05.amount+G.KANDY.amount],['Food (Surati + Dmart)',G.S01.amount+G.S08.amount],['Cabs (airport, home, PickMe)',G.S06.amount+G.S07.amount+G.HC01.amount+G.HC02.amount+data.pickmeTotal],['Scapia card',data.scapiaTotal],['Very personal expenses',data.personalTotal],['Other cash payment',data.cashExpenseTotal]];
 const pool=data.members.filter(m=>m.poolUse>0).sort((a,b)=>b.poolUse-a.poolUse)[0];
 const share=e=>Object.entries(e.shares).filter(([,v])=>v).map(([n,v])=>`${n} ${money(v)}`).join(', ');
 return [
 {title:'The basics',sub:'Start here if the numbers look confusing.',items:[
 {q:'What does “group balance” mean?',a:`<p>It is the net amount between you and the group once every bill on the trip is counted.</p><p><strong>Plus (receive):</strong> you paid more than your share, so the group owes you.<br><strong>Minus (pay):</strong> you paid less than your share, so you owe the group.</p>`},
 {q:'How is each balance calculated?',a:`<p><strong>Group balance = what you paid in − your share of every expense.</strong></p><p>“Paid in” covers your flight, your ₹15,000 cash and any bill you paid from your own pocket or card. “Your share” is your part of every bill, including bills paid by others.</p>`},
 {q:`What is the ${money(data.total)} total trip cost made of?`,a:`<div class="line-items">${cats.map(([l,a])=>line(l,a)).join('')}${line('Total recorded trip cost',data.total,'Personal pooled-cash draws are not added again.','total')}</div>`},
 {q:'Why do my flight and my ₹15,000 cash not change my balance?',a:`<p>Each person’s ticket (${money(G.FLIGHTS.amount/7)}) and ₹15,000 cash count both as something you paid in and as your own cost, so they cancel out. Only shared bills, cards, cabs, extras and pooled-cash adjustments move your balance.</p>`},
 {q:'Why do the plus and minus amounts match?',a:`<p>Every rupee someone is owed is a rupee someone else owes.</p>${line(`To receive (${names(recv)})`,sum(recv))}${line(`To pay (${names(pay)})`,sum(pay))}<p>The two totals are equal, apart from paise rounding.</p>`},
 {q:'How do we actually settle up?',a:`<p>People in minus pay the group, and people in plus receive. In total ${money(sum(pay))} needs to move from ${names(pay)} to ${names(recv)}.</p><p>This dashboard does not record payments or decide who sends money to whom. Separate repayments to Rushang (see below) are settled on top of this.</p>`}]},
 {title:'Why is each person plus or minus?',sub:'One answer for every traveller, using the recorded numbers.',items:[...data.members].sort((a,b)=>b.groupNet-a.groupNet).map(m=>({q:`Why is ${m.name} in ${m.groupNet>=0?'plus':'minus'} (${m.groupNet>=0?'receives':'pays'} ${money(Math.abs(m.groupNet))})?`,a:faqPersonAnswer(m)}))},
 {title:'Separate repayments to Rushang',sub:'Debts that are kept outside the group balance.',items:[
 {q:`Why does Pankaj owe Rushang ${money(M.Pankaj.separateDebt)} even though he is in plus?`,a:`<p>Rushang paid for Pankaj’s flight (${money(35500)}). In the group calculation the ticket is credited to the traveller, like everyone else’s, so this debt is <strong>not</strong> inside his group balance of ${money(M.Pankaj.groupNet)}.</p><p>They are two different amounts: ${money(M.Pankaj.groupNet)} to receive from the group, and ${money(M.Pankaj.separateDebt)} to repay Rushang. They are kept separate on purpose so each can be checked on its own.</p>`},
 {q:`What is Pranav’s ${money(M.Pranav.separateDebt)}?`,a:`${line('Flight advance paid by Rushang',M.Pranav.separateDebt-ownTotal)}${line(`${own.length} personal Scapia purchases`,ownTotal,own.map(e=>esc(e.description)).join(' · '))}${line('Pranav → Rushang',M.Pranav.separateDebt,'','total')}<p>Pranav’s earlier ₹14,500 + ₹21,500 totals ₹36,000 against a ₹35,500 ticket. The ₹500 difference is kept outside trip costs.</p>`},
 {q:'Why are Pranav’s own Scapia purchases not in his group balance?',a:`<p>Rushang’s card paid for them, but they belong to Pranav alone. They are counted in both his paid-in amount and his cost, so they cancel out of his group balance. He repays Rushang for them in the separate ${money(ownTotal)} above.</p>`},
 {q:`How is Rushang’s ${money(G.VP04.amount)} for Pankaj handled?`,a:`<p>Rushang paid ${money(G.VP04.amount)} by UPI for Pankaj alone (VP04). The full amount is charged to Pankaj and credited to Rushang <strong>inside the group balance</strong>, so no separate payment is needed. It is settled through the group balance.</p>`}]},
 {title:'Shared bills and splits',sub:'How each kind of bill is divided.',items:[
 {q:'How are shared bills split?',a:`<p>Equally among the people named on the bill, rounded to paise. Any leftover paise goes to the last person on that bill, so the shares always add up to the exact amount. Most bills are split among all 7 adults.</p>`},
 {q:`Who paid the ${money(G.S01.amount)} Surati food bill?`,a:`<p>${esc(G.S01.paidBy)} paid it. It is split among all 7 adults (${money(G.S01.amount/7)} each) and ${esc(G.S01.paidBy)} is credited the full amount.</p>`},
 {q:'Why is Pankaj not part of the home cabs?',a:`<p>The two return-home cabs (${money(G.HC01.amount)} paid by Pranav and ${money(G.HC02.amount)} paid by Rushabh) are split among six adults. Pankaj is excluded.</p>`},
 {q:'Why is the Kandy villa not split equally?',a:`<p>Kandy (${money(G.KANDY.amount)}) uses each person’s own room and upgrade allocation instead of an equal split. All ${money(G.KANDY.amount)} is allocated.</p><div class="line-items">${data.members.map(m=>line(m.name,m.kandy)).join('')}</div>`},
 {q:'What are “very personal” expenses?',a:`<p>Personal bills paid by one traveller for only the named people. Only those people share the bill; everyone else is excluded.</p>${data.personalPayments.map(e=>line(esc(e.description),e.amount,`Paid by ${esc(e.paidBy)} · ${share(e)}`)).join('')}${line('Total',data.personalTotal,'','total')}`},
 {q:'What are extra cash, PickMe and the ₹100 cash payment?',a:`<p>These were paid from travellers’ own money and shared by all 7 adults. Each payer is credited, and everyone bears an equal share.</p>${line('Extra cash exchange (Rushabh and Pranav)',data.extraCashTotal)}${line('PickMe cabs (Rushabh, Rushang, Pranav)',data.pickmeTotal)}${line('Shared cash payment (Pranav)',data.cashExpenseTotal)}`},
 {q:'How does the Scapia card work?',a:`<p>All ${data.scapia.length} Scapia purchases (${money(data.scapiaTotal)}) were paid on Rushang’s card. Group purchases are split among the people named on each bill, so some people are not in every entry. Purchases for Pranav alone are repaid separately.</p><p>Card statement verification is still pending for every entry.</p>`}]},
 {title:'Pooled cash',sub:'Cash everyone contributed and some people used personally.',items:[
 {q:'What is pooled cash?',a:`<p>Each adult carried ₹15,000 in cash (${money(G.CASH.amount)} total). That cash is already counted once in the trip cost.</p>`},
 {q:'Why do some people have a pooled-cash adjustment?',a:`<p>Some purchases from the pool were personal. Each is charged to the people who used it. The same total (${money(data.pooledTotalINR)}) is credited equally to all 7 contributors (${money(pool?pool.poolEqual:0)} each).</p><p>Adjustment = personal pooled use − equal credit.${pool?` For example, ${pool.name} used ${money(pool.poolUse)}, so the adjustment is ${money(pool.poolUse)} − ${money(pool.poolEqual)} = ${money(-pool.poolNet)} ${pool.poolNet<0?'added to their expense':'credited against their expense'}.`:''}</p>`},
 {q:'Which conversion rate is used?',a:`<p>${poolConversionNote()}. Each pooled entry is converted at that same rate.</p>`},
 {q:'Does pooled spending add to the trip total?',a:`<p>No. It only moves cost between people. The cash is already in the total, so nothing is added twice.</p>`}]},
 {title:'About this dashboard',sub:'What it can and cannot do.',items:[
 {q:'How can I check whether an expense is already added?',a:`<p>Open the Expenses tab and search by amount, bill name or person, for example “480” or “Rushabh”.</p><a class="text-button" href="#expenses" data-all-expenses>Search all expenses ${ico('arrow')}</a>`},
 {q:'Does this dashboard record payments?',a:`<p>No. It is view-only and shows the recorded numbers. Updates appear when the dashboard is republished.</p>`},
 {q:'Is the Excel workbook up to date?',a:`<p>No. The workbook is an earlier snapshot. Use this dashboard for the latest entries.</p>`},
 {q:'Why do some entries have no date, and why is Day 2 empty?',a:`<p>Some dates were not supplied (for example the return-home cabs). Day 2 has no supplied bills, which does not confirm zero spending.</p>`},
 {q:'What is still unconfirmed?',a:`<p>The Scapia card entries are pending verification against the statement. For Rushabh’s extra cash, the INR cost is recorded, but the USD converted and LKR received were not supplied.</p>`}]}
 ];
}
function faqView(){
 return `${intro('QUESTIONS & ANSWERS','Frequently asked questions.','Plain answers to the common “why is my balance like this?” questions, using the recorded numbers.')}<div class="faq-tools"><label class="search faq-search">${ico('search')}<input id="faq-search" type="search" placeholder="Search a question or a name" aria-label="Search questions"></label></div>${faqSections().map(s=>`<section class="faq-section"><h2>${s.title}</h2><p>${s.sub}</p>${s.items.map(i=>`<details class="faq-item"><summary>${i.q}</summary><div class="faq-answer">${i.a}</div></details>`).join('')}</section>`).join('')}<div class="empty-results" id="faq-empty" hidden>No matching question. Try another name or word.</div>`;
}
document.addEventListener('input',e=>{
 if(e.target.id!=='faq-search')return;
 const q=e.target.value.toLowerCase().trim();let shown=0;
 document.querySelectorAll('.faq-item').forEach(el=>{const hit=!q||el.textContent.toLowerCase().includes(q);el.hidden=!hit;if(hit)shown++;});
 document.querySelectorAll('.faq-section').forEach(s=>{s.hidden=!s.querySelector('.faq-item:not([hidden])');});
 document.getElementById('faq-empty').hidden=!!shown;
});
