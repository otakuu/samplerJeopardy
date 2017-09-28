/*
	@file	piraten-jeopardy-4.js
	@author	Herbert Janssen
	@date	2010-03-18 - 2010-03-31
	@email	heja2009@gmx.de
	@brief	jeopardy done as a javascript app (not sure wether it is Ajax, i.e., async)
			should run in any modern browser (Safari, Firefox, Chrome, Opera @ 2010)
			this is my first javascript app, it hurt very little though
	@description
			buzzers are assumed to output keys, this can be easily done by e.g. mapping WII controllers to keys
			score_table and player_table are the central data structures that hold all the per-round information
	@todo	double jeopardy, sounds, countdown timer
	@bugs	background music (?)
			read jeo.categories from round_file
			player table should be centered
			vertical align text in overlay
			can not select cell under overlay
			in round data: double jeopardy depends only on existence of jeopardy field
*/


///////////////////////////////////////////////////////////////////////////////
// create main object
function Jeopardy( categories, players, rows )
{
this.base_URL = "http://gaia-elkartea.com/pdf/jeopardy/";

this.categories = categories;			// should be 5 or 6
this.players = players;						// should be 3 or 4
this.rows = rows;									// must be 5
this.is_locked = false;						// any player pressed button?
this.selected_player = undefined;	// player who pressed button (none: undefined)
this.selected_cell = undefined;		// [column, row] starting with [0, 0] or undefined
this.double_jeopardy = false;			// double jeopardy
this.points = undefined;					// points this round is worth

this.player_color = [];
this.player_color[0] = "#330000";
this.player_color[1] = "#000033";
this.player_color[2] = "#003300";
this.player_color[3] = "#300030";

this.normal_color = "#FFA500";
this.background_color = "#000000";
this.highlight_color = "#FFFFFF";
	
doc.fgColor = this.normal_color;
this.round = undefined;

return this;
}

///////////////////////////////////////////////////////////////////////////////
// constructors (create DOM tree)
///////////////////////////////////////////////////////////////////////////////
function Background_Music()
{
this.audio = doc.createElement("audio");
this.audio.setAttribute( "src", jeo.base_URL+"bgmusic-intro.wav" );
this.audio.setAttribute( "autoplay", true );
this.audio.setAttribute( "loop", true );

return this;
}

///////////////////////////////////////////////////////////////////////////////
// create headline
function Headline()
{
var headline_div = doc.createElement("div");

var headline = doc.createElement("h2");
headline.align="center";


var headline_text = doc.createTextNode("Sampler Jeopardy");
headline.appendChild(headline_text);
headline_div.appendChild(headline);
doc.body.appendChild(headline_div);

return this;
}

///////////////////////////////////////////////////////////////////////////////
// create problem/solution overlay
function Overlay()
{

this.div = doc.createElement("div");
this.div.id= "dialog";
this.div.style.visibility = "hidden";
this.div.style.position = "fixed";
this.div.style.top = "20%";
this.div.style.left = "16%";
this.div.style.width = "60%";
this.div.style.height = "50%";
this.div.style.fontFamily = "Helvetica";
this.div.style.fontSize = "3em";
this.div.style.verticalAlign = "middle";
this.div.style.textAlign = "center";
this.div.style.borderStyle = "solid";
this.div.style.borderWidth = "1em";
this.div.style.borderColor = "#AAAAAA";
//this.div.style.color = jeo.normal_color;
//this.div.style.backgroundColor = jeo.background_color;
this.div.style.color = jeo.background_color;
this.div.style.backgroundColor = jeo.normal_color;
this.div.style.opacity = 1;
//this.div.style.backgroundImage = "url(background.jpg)";
this.div.style.backgroundRepeat = "no-repeat";
this.div.style.backgroundPosition = "center";
this.div.style.display = "none";


var btn1 = document.createElement("BUTTON");
var t1 = document.createTextNode("Spieler 1");
btn1.appendChild(t1);
btn1.id="btn1";
this.div.appendChild(btn1);

var btn2 = document.createElement("BUTTON");
var t2 = document.createTextNode("Spieler 2");
btn2.appendChild(t2);
btn2.id="btn2";
this.div.appendChild(btn2);

var btn3 = document.createElement("BUTTON");
var t3 = document.createTextNode("Spieler 3");
btn3.appendChild(t3);
btn3.id="btn3";
this.div.appendChild(btn3);

var btn4 = document.createElement("BUTTON");
var t4 = document.createTextNode("Spieler 4");
btn4.appendChild(t4);
btn4.id="btn4";
this.div.appendChild(btn4);

var btn5 = document.createElement("BUTTON");
var t5 = document.createTextNode("Rischtisch");
btn5.appendChild(t5);
btn5.id="btn5";
btn5.style.background='#00ff00';
this.div.appendChild(btn5);

var btn6 = document.createElement("BUTTON");
var t6 = document.createTextNode("Falsch");
btn6.appendChild(t6);
btn6.id="btn6";
btn6.style.background='#ff0000';
this.div.appendChild(btn6);

var btn7 = document.createElement("BUTTON");
var t7 = document.createTextNode("Give up");
btn7.appendChild(t7);
btn7.id="btn7";
this.div.appendChild(btn7);

this.iframe = doc.createElement("div");
this.iframe.id="player";
this.iframe.style.visibility="hidden";
this.iframe.style.opacity=0;
this.iframe.style.display = "none";

this.text = doc.createTextNode( "Das ist das Problem. "+
								"Es ist lang, um zu testen wie das mit dem Zeilenumbruch fluppt." );
this.div.appendChild(this.text);
this.div.appendChild(this.iframe);
doc.body.appendChild(this.div);

return this;
}
        

///////////////////////////////////////////////////////////////////////////////
// create main table
function Score_Table( categories, players, rows )
{
var table = doc.createElement("table");
table.width="100%";
table.setAttribute( "height", screen.height*.6 );
table.border=1;
table.id="score_table";
var tbody = doc.createElement("tbody");
var tr0 = doc.createElement("tr");
var td0 = [];
this.td0_text = [];
for( i=0; i<categories; ++i )
	{
	td0[i] = doc.createElement( "td" );
	if( jeo.categories == 6 )
		td0[i].width="16%";
	else
		td0[i].width="20%";
	this.td0_text[i] = doc.createTextNode( "Kategorie "+(i+1) );
	td0[i].appendChild( this.td0_text[i] );
	tr0.appendChild( td0[i] );
	tr0.style.fontWeight = "800";
	}
tbody.appendChild(tr0);

var tr = [];
this.td = [];
var td_text = [];
for( i=0; i<categories; ++i )
	{
	this.td[i] = new Array(rows);
	td_text[i] = new Array(rows);
	}
for( j=0; j<rows; ++j )
	{
	tr[j] = doc.createElement("tr");
	for( i=0; i<categories; ++i )
		{
		this.td[i][j] = doc.createElement("td");
		this.td[i][j].addEventListener( "click", cell_click, false );
		td_text[i][j] = doc.createTextNode( ((j+1)*100) );
		this.td[i][j].appendChild(td_text[i][j]);
		tr[j].appendChild(this.td[i][j]);	
		}
	tbody.appendChild(tr[j]);
	}
table.appendChild(tbody);
doc.body.appendChild(table);
	
//getTd: function() {return td};
	
return this;
}

///////////////////////////////////////////////////////////////////////////////
function Player_Table( players )
{
var table = doc.createElement("table");
table.width="50%";
table.setAttribute( "height", screen.height*.2 );
table.border=1;
table.id="player_table";
var tbody = doc.createElement("tbody");
var tr0 = doc.createElement("tr");
this.td0 = [];
for( i=0; i<players; ++i )
	{
	this.td0[i] = doc.createElement("td");
	this.td0[i].addEventListener( "click", player_click, false );
	this.td0[i].id="playerId"+(i+1);
	var td0_text = doc.createTextNode( "Spieler "+(i+1) );
	this.td0[i].appendChild(td0_text);
	tr0.appendChild(this.td0[i]);
	}
tbody.appendChild(tr0);
var tr1 = doc.createElement("tr");
this.td1 = [];
for( i=0; i<players; ++i )
	{
	this.td1[i] = doc.createElement("td");
	this.td1[i].width="25%";
	this.td1[i].addEventListener( "click", points_click, false );
	var td1_text = doc.createTextNode( "0" );
	this.td1[i].appendChild(td1_text);
	tr1.appendChild(this.td1[i]);
	}
tbody.appendChild(tr1);
table.appendChild(tbody);
doc.body.appendChild(table);
	
this.td0[0].style.backgroundColor = jeo.player_color[0];
this.td0[1].style.backgroundColor = jeo.player_color[1];
this.td0[2].style.backgroundColor = jeo.player_color[2];
this.td0[3].style.backgroundColor = jeo.player_color[3];

this.td1[0].style.backgroundColor = jeo.player_color[0];
this.td1[1].style.backgroundColor = jeo.player_color[1];
this.td1[2].style.backgroundColor = jeo.player_color[2];
this.td1[3].style.backgroundColor = jeo.player_color[3];

return this;
}

///////////////////////////////////////////////////////////////////////////////
// event handlers (user interface)
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
function player_click(e)
{

var player_name=prompt("Player name:",this.childNodes[0].data);
if(!player_name)
	return;
//alert(player_name);

this.childNodes[0].data = player_name;

var clickedItem = e.target.id;
var playerId = clickedItem.slice(-1);

switch (parseInt(playerId)) {
    
    case 1:
        var b = document.getElementById('btn1');
        break;
    case 2:
        var b = document.getElementById('btn2');
        break;
    case 3:
        var b = document.getElementById('btn3');
        break;
    case 4:
        var b = document.getElementById('btn4');
        break;
      }

b.innerHTML=player_name;
}

///////////////////////////////////////////////////////////////////////////////
function points_click(e)
{
var points=prompt("Set points:",this.childNodes[0].data);
if( !points )
	return;
//alert(points);
points = parseInt(points);
//alert(points);
points = points.toString();
//alert(points);
this.childNodes[0].data = points;
}

///////////////////////////////////////////////////////////////////////////////
function keydown_handler(e)
{
//alert("e.which="+e.which);
if( e.which == 72 )			// 'h' => help
	alert( "Hilfe:\n"+
			"'L' lädt Runden-Daten\n"+
			"'1', '2', '3' oder '4' selektieren Spieler\n"+
			"'T' wertet als richtig\n"+
			"'F' wertet als falsch\n"+
			"'G' wertet als aufgegeben\n"+
			"'C' schließt Overlay\n"+
			"'O' öffnet Overlay\n"+
			"click in Rundenfeld lädt neue Datei\n"+
			"click in Punkte-Zelle wählt Problem aus\n"+
			"click auf Spieler-Name ändert Spieler Namen\n"+
			"click auf Spieler-Punkte ändert Spieler-Punkte" );
else if( e.which == 84 )	// 't' => true
	solution_true();
else if( e.which == 70 ){	// 'f' => false
	solution_false();
	    player.playVideo();
	    }
else if( e.which == 71 ){	// 'g' => give up
	give_up();
    player.pauseVideo();
    }
else if( e.which == 67 ){	// 'c' => close overlay
	overlay.div.style.visibility = "hidden";
document.getElementById('player').style.visibility = "hidden";	
document.getElementById('player').style.opacity = 0;
document.getElementById('player').style.display = "none";
document.getElementById('dialog').style.display = "none";
    }
else if( e.which == 79 ){	// 'o' => open overlay
	overlay.div.style.visibility = "visible";
document.getElementById('player').style.visibility = "visible";	
document.getElementById('player').style.opacity = 1;
document.getElementById('player').style.display = "block";
document.getElementById('dialog').style.display = "block";
    }
else if( e.which == 76 )	// 'l' => load round file
	load_round_file();
else if( e.which == 49 ){	// '1' => player 1
	select_player( 1 );
    player.pauseVideo();
}
else if( e.which == 50 ){	// '2' => player 2
	select_player( 2 );
	player.pauseVideo();
	}
else if( e.which == 51 ){	// '3' => player 3
	select_player( 3 );
    player.pauseVideo();
	}
else if( e.which == 52 ){   // '4' => player 4
	select_player( 4 );
	player.pauseVideo();
	}
}

///////////////////////////////////////////////////////////////////////////////
function cell_click(e)
{
/*
var msg = "click at " +
		"x = " + e.clientX + ", " +
		"y = " + e.clientY +
		", this = " + this +
		", this.value = " + this.value +
		", this.data = " + this.data;
for( i=0; i<this.childNodes.length; ++i )
	{
	msg += ", this.childNodes["+i+"] = " + this.childNodes[i] +
		", this.childNodes["+i+"].value = " + this.childNodes[i].value +
		", this.childNodes["+i+"].data = " + this.childNodes[i].data;
	}
alert(msg);

alert( "score_table="+score_table );
alert( "score_table.td="+score_table.td );
alert( "score_table.td[0][0]="+score_table.td[0][0] );
*/
var is_found = false;

if( jeo.selected_cell != undefined )
	return;

//alert( "this.style.color = "+this.style.color );
if( this.style.color != 0 )
	{
	//alert( "cell ["+i+"]["+j+"] already has color "+this.style.color );
	alert( "This problem was already solved!" );
	return;
	}

for( i=0; i<jeo.categories; ++i )
	for( j=0; j<jeo.rows; ++j )
		if( this == score_table.td[i][j] )
			{
			//alert( "cell ["+i+"]["+j+"] selected" );
			jeo.selected_cell = [i, j];
			score_table.td[i][j].style.color = jeo.highlight_color;
			jeo.points = 100*(1+jeo.selected_cell[1]);
			jeo.is_locked = false;
			show_double_jeopardy();
			show_problem();
			is_found = true;
			}
if( !is_found )
	alert( "error: cell not found" );
}

///////////////////////////////////////////////////////////////////////////////
// event handling utility functions (user interface)
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
function show_double_jeopardy()
{
}

///////////////////////////////////////////////////////////////////////////////
// player pressed button (tries to solve problem)
function select_player( player )
{
if( jeo.selected_cell==undefined )
	{
	alert("kein Problem ausgewählt");
	return;
	}
if( jeo.is_locked )
	{
	if( jeo.selected_player == player )
		alert( "Spieler "+player+" ist nervös!" );
	else if( jeo.selected_player == undefined )
		alert( "internal error: jeo.selected_player is undefined although jeo.is_locked" );
	else
		alert( "Spieler "+jeo.selected_player+" war schneller" );
	return;
	}
jeo.is_locked = true;
jeo.selected_player = player;

//alert( "Spieler "+player );

//player_table.td0[player-1].style.fontWeight = "bold";
player_table.td0[player-1].style.color = jeo.highlight_color;
//player_table.td0[player-1].style.backgroundColor = "#000000";
//player_table.td0[player-1].style.textDecoration = "blink";
}

///////////////////////////////////////////////////////////////////////////////
// player no longer selected
function deselect_player( player )
{
jeo.selected_player = undefined;
player_table.td0[player-1].style.color = jeo.normal_color;
}

///////////////////////////////////////////////////////////////////////////////
function load_fake_round_file()
{
var round_data = eval("(" + testdata + ")");
//alert( testdata );
//alert( round_data.data );

jeo.round = round_data.data;

for( i=0; i<jeo.categories; ++i )
	score_table.td0_text[i].data = jeo.round[i].base_URL;

return round_data.data;
}

///////////////////////////////////////////////////////////////////////////////
function load_round_file()
{
//var default_URL = jeo.base_URL+"runde-1.txt";
var default_URL = jeo.base_URL+"Runde-1.json";
var round_URL = prompt( "URL der Runden-Datei:", default_URL );
if( !round_URL )
	return;

//alert( round_URL );

var round_request = new XMLHttpRequest();

round_request.open( "GET", round_URL, false ); // (method, URL, async?)
//round_request.setRequestHeader( "User-Agent", navigator.userAgent );
try {
	round_request.send( null );
	} catch (error) {
	alert( "error: XMLHttpRequest.send() failed, "+error.name+": "+error.message );
	}

if( round_request.status!=200 )
	{
	alert( "error: XMLHttpRequest()="+round_request.status );
	return undefined;
	}

//alert(round_request.responseText);

var round_data = eval("(" + round_request.responseText + ")");
//alert( round_data );
//alert( round_data.data );
	
jeo.round = round_data.data;

for( i=0; i<jeo.categories; ++i )
	score_table.td0_text[i].data = jeo.round[i].category;

return round_data.data;
/*
var oRequest = new XMLHttpRequest();
var sURL  = "http://"+self.location.hostname+"/faq/requested_file.htm";

oRequest.open("GET",sURL,false);
oRequest.setRequestHeader("User-Agent",navigator.userAgent);
oRequest.send(null)

if (oRequest.status==200)
	alert(oRequest.responseText);
else
	alert("Error executing XMLHttpRequest call!");
*/
}

///////////////////////////////////////////////////////////////////////////////
function show_problem()
{
if( jeo.selected_cell==undefined )
	{
	alert("kein Problem ausgewählt");
	return;
	}

//alert( "selected_cell="+jeo.selected_cell );
//alert("problem");
//alert("overlay.text.data "+overlay.text.data);
if( jeo.round==undefined )
	overlay.text.data = "Zuerst sollten Runden-Daten eingelesen werden. "+
						"Dies geschieht wenn man die L-Taste betätigt. "+
						"(Hilfe bekommt man übrigens mit der H-Taste.) "+
						"Nach Laden einer Runden-Datei steht hier dann das Problem.";
else
	{
	var cell = jeo.round[jeo.selected_cell[0]].data[jeo.selected_cell[1]];
	//alert( "(i, j) = ("+jeo.selected_cell[0]+", "+jeo.selected_cell[0]+")" );
	//alert( "jeopardy="+cell.jeopardy );
	if( cell.jeopardy )
		jeo.jeopardy = true;
	else
		jeo.jeopardy = false;
	if( cell.problem )
		{
		overlay.div.style.backgroundImage = "url(undefined)";
/*
		if( cell.jeopardy )
			overlay.text.data = "DOUBLE JEOPARDY: ";
		else
			overlay.text.data = "";
*/
		overlay.text.data = "";
		player.loadVideoById(cell.problem,cell.solution);

		}
	else
		{
/*
		if( cell.jeopardy )
			overlay.text.data = "DOUBLE JEOPARDY: ";
		else
			overlay.text.data = "";
*/
		overlay.div.style.backgroundImage = "url("+cell.problem_img+")";
		overlay.text.data = "";
		//this.iframe.src=cell.problem+"?autoplay=1&enablejsapi=1&origin=*";
		player.loadVideoById(cell.problem,cell.solution);


		}
	}

document.getElementById('player').style.visibility = "visible";	
document.getElementById('player').style.opacity = 1;
document.getElementById('player').style.display = "block";

overlay.div.style.visibility = "visible";
overlay.div.style.display = "block";


}

///////////////////////////////////////////////////////////////////////////////
function show_solution()
{
if( jeo.selected_cell==undefined )
	{
	alert("kein Problem ausgewählt");
	return;
	}

//alert("solution");
if( jeo.round==undefined )
	{
	overlay.div.style.backgroundImage = "url(undefined)";
	overlay.text.data = "Sind immer noch keine Runden-Daten eingelesen worden? "+
						"Bist Du ein Beta-Tester oder so?";
	}
else
	{
	overlay.div.style.backgroundImage = "url(undefined)";
	overlay.text.data = jeo.round[jeo.selected_cell[0]].data[jeo.selected_cell[1]].solution;
	}

overlay.div.style.visibility = "hidden";
overlay.div.style.display = "none";
document.getElementById('player').style.visibility = "hidden";	
document.getElementById('player').style.opacity = 0;
document.getElementById('player').style.display = "none";

}

///////////////////////////////////////////////////////////////////////////////
function solution_true()
{
if( jeo.selected_player==undefined )
	{
	alert("kein Spieler ausgewählt");
	return;
	}
if( jeo.selected_cell==undefined )
	{
	alert("kein Problem ausgewählt");
	return;
	}

// add points
score_table.td[jeo.selected_cell[0]][jeo.selected_cell[1]].style.backgroundColor = jeo.player_color[jeo.selected_player-1];
var points = parseInt(player_table.td1[jeo.selected_player-1].childNodes[0].data);
//alert("previous points="+points);
//points += 100*(1+jeo.selected_cell[1]);
points += jeo.points;
player_table.td1[jeo.selected_player-1].childNodes[0].data = points;

deselect_player(jeo.selected_player);
show_solution();
jeo.selected_cell = undefined;
}

///////////////////////////////////////////////////////////////////////////////
function solution_false()
{
if( jeo.selected_player==undefined )
	{
	alert("kein Spieler ausgewählt");
	return;
	}
if( jeo.selected_cell==undefined )
	{
	alert("kein Problem ausgewählt");
	return;
	}

// subtract points
var points = parseInt(player_table.td1[jeo.selected_player-1].childNodes[0].data);
//alert("previous points="+points);
//points -= 100*(1+jeo.selected_cell[1]);
points -= jeo.points;
player_table.td1[jeo.selected_player-1].childNodes[0].data = points;

deselect_player(jeo.selected_player);
jeo.is_locked = false;
}

///////////////////////////////////////////////////////////////////////////////
function give_up()
{
if( !(jeo.selected_player==undefined) )
	{
	alert("es ist Spieler "+jeo.selected_player+" ausgewählt");
	return;
	}
if( jeo.selected_cell==undefined )
	{
	alert("kein Problem ausgewählt");
	return;
	}

show_solution();
//jeo.is_locked = false;
jeo.selected_cell = undefined;
}

///////////////////////////////////////////////////////////////////////////////
// main code
///////////////////////////////////////////////////////////////////////////////

//document.getElementById("Bereich").addEventListener( "click", handle_click, false );

//alert('screen size is '+screen.width+'x'+screen.height);

var doc = document;				// just a shortcut

doc.addEventListener( "keydown", keydown_handler, false );

var jeo = new Jeopardy( 5, 4, 5 ); // categories, players, rows

//var bgmusic = Background_Music();

var overlay = Overlay();

var headline = Headline();

var score_table = new Score_Table( jeo.categories, jeo.players, jeo.rows );

var p = doc.createElement("p");
doc.body.appendChild(p);

var player_table = Player_Table( 4 );

//load_fake_round_file();
load_round_file();

///////////////////////////////////////////////////////////////////////////////
// here be dragons
///////////////////////////////////////////////////////////////////////////////

/*
var main_table = new Array(jeo.categories);
for( i=0; i<jeo.categories; ++i )
	{
	main_table[i] = new Array(jeo.rows);
	main_table[i][0] = {category:"Kategorie"+i, is_img:false};
	for( j=1; j<=jeo.rows; ++j )
		main_table[i][j] = {
							points:0,			// points for this cell
							problem:"P",		// text of the problem or image filename
							solution:"S",		// text of the solution
							solved:undefined	// player number who solved cell or undefined
							};
	}
*/

//var solved_image;	// image to display for solved cells
//var buzzer_image;	// image to show for player hit buzzer

/*
pseudo code

buttons:
load...

on click in cell:	locked=false; selected_player=0;	play_slide();	show_problem();		// show problem
on key input 1:		locked=true; selected_player=1; 	play_buzz();	show_buzzer();		// player tries
on key input y: 	add_points(); set_solved(); 		play_pinpon();	show_solution();	// player wins
on key input n: 	sub_points(); locked=false; 		play_burp();	show_problem();		// player loses
on key input g: 	set_solved(); 						play_sad();		show_solution();	// players gave up
on click in player cell: +/- edit mode														// manual correction
*/

doc.title="Sampler Jeopardy";
