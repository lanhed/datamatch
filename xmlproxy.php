<?php 

ini_set('display_errors', false);
set_exception_handler('ReturnError');

$r = '';
$url = (isset($_GET['url']) ? $_GET['url'] : null);

if ($url) {

	// fetch XML
	$c = curl_init();
	curl_setopt_array($c, array(
		CURLOPT_URL => $url,
		CURLOPT_HEADER => false,
		CURLOPT_TIMEOUT => 100,
		CURLOPT_RETURNTRANSFER => true
	));
	$r = curl_exec($c);
	curl_close($c);

}

if ($r) {
	// XML to JSON
	$xml = new SimpleXMLElement( $r );
	if ( !function_exists('json_encode') ) {
		function json_encode( $content ) {
			require_once 'Services/JSON.php';
			$json = new Services_JSON;

			return $json->encode( $content );
		}

		echo json_encode($xml->plannerLocale);
	} else {
		echo json_encode($xml->plannerLocale);
	}
}
else {
	// nothing returned?
	ReturnError();
}

// return JSON error flag
// det hade varit najs och kunna hantera server status i exeption handlern
function ReturnError() {
	echo '{"error":true}';
}

?>