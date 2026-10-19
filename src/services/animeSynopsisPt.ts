const SYNOPSES_PT: Array<[string[], string]> = [
    [['attack on titan', 'shingeki no kyojin'], 'A humanidade vive cercada por muralhas para se proteger dos Titãs, criaturas gigantes que devoram pessoas. Depois que um ataque destrói sua cidade e muda sua vida, Eren Jaeger se junta à Tropa de Exploração ao lado de Mikasa e Armin para lutar pela sobrevivência.'],
    [['one piece'], 'Monkey D. Luffy parte para o mar determinado a encontrar o lendário tesouro One Piece e se tornar o Rei dos Piratas. Ao longo da jornada, reúne companheiros e enfrenta os perigos da Grand Line.'],
    [['bleach tybw', 'bleach thousand year blood war'], 'Ichigo Kurosaki e os Ceifeiros de Almas enfrentam os Quincy, liderados por Yhwach, quando uma guerra antiga ameaça destruir a Sociedade das Almas e o mundo dos vivos.'],
    [['bleach'], 'Ichigo Kurosaki consegue poderes de uma Ceifeira de Almas e passa a proteger as pessoas de espíritos malignos chamados Hollows, enquanto se envolve em conflitos entre o mundo humano e a Sociedade das Almas.'],
    [['jujutsu kaisen'], 'Yuji Itadori leva uma vida comum até engolir um dedo amaldiçoado para salvar um colega. Com Sukuna vivendo em seu corpo, Yuji entra na Escola Técnica de Feitiçaria de Tóquio e passa a combater maldições.'],
    [['chainsaw man'], 'Denji caça demônios para pagar as dívidas que herdou. Depois de ser traído e morto, faz um pacto com Pochita e renasce como o Homem-Motosserra, um híbrido com o coração do Demônio da Motosserra.'],
    [['demon slayer', 'kimetsu no yaiba'], 'Tanjiro Kamado, um garoto bondoso que sustenta a família vendendo carvão, encontra seus familiares mortos por um demônio. Sua irmã Nezuko sobrevive, mas também se transforma em demônio; Tanjiro decide entrar no Esquadrão de Caçadores de Demônios para tentar salvá-la.'],
    [['my hero academia', 'boku no hero'], 'Em um mundo onde a maioria das pessoas possui superpoderes, Izuku Midoriya nasceu sem uma individualidade, mas sonha em ser um herói. Sua vida muda quando conhece All Might e recebe a chance de estudar na U.A., uma escola de formação de heróis.'],
    [['spy x family'], 'Para cumprir uma missão e preservar a paz entre duas nações, o espião Twilight precisa formar uma família de fachada. Ele adota Anya, uma telepata, e se casa com Yor, uma assassina; cada um esconde sua verdadeira identidade dos outros.'],
    [['hunter x hunter'], 'Gon Freecss, um garoto que vive na Ilha da Baleia, decide se tornar um Hunter como seu pai, que partiu quando ele ainda era pequeno. Em sua jornada, faz amigos e enfrenta provas perigosas.'],
    [['naruto shippuden'], 'Após treinar por dois anos e meio, Naruto Uzumaki retorna à Vila da Folha. Ao lado de seus companheiros, ele enfrenta a organização Akatsuki e busca resgatar Sasuke enquanto amadurece como ninja.'],
    [['dragon ball daima'], 'Depois de uma conspiração, Goku e seus amigos são transformados em crianças. Para desfazer a transformação, eles partem para um novo mundo e enfrentam perigos desconhecidos.'],
    [['dragon ball z'], 'Goku e seus amigos protegem a Terra de ameaças cada vez mais poderosas. A chegada de guerreiros de outros planetas revela as origens de Goku e inicia batalhas que colocam o universo em risco.'],
    [['tensei shitara slime', 'slime datta ken'], 'Mikami Satoru, funcionário de uma megacorporação, é apunhalado por um assassino nas ruas e renasce num mundo paralelo... Mas ele renasce como um slime! Jogado neste novo mundo com o nome Rimuru, ele assume a missão de criar um mundo que seja acolhedor para todas as raças.'],
    [['mushoku tensei'], 'Após morrer em um acidente, um homem reencarna como Rudeus Greyrat em um mundo de fantasia. Mantendo as lembranças da vida anterior, ele decide aproveitar a nova chance e aprende magia enquanto cresce.'],
    [['re zero'], 'Subaru Natsuki é transportado para outro mundo e descobre que, ao morrer, retorna a um ponto anterior no tempo. Preso nesse ciclo, ele tenta proteger as pessoas que encontra e mudar os acontecimentos que levam à tragédia.'],
    [['blue exorcist', 'ao no exorcist'], 'Rin Okumura descobre ser filho de Satanás e herda poderes demoníacos. Em vez de aceitar seu destino, decide se tornar um exorcista e lutar contra as forças que ameaçam o mundo humano.'],
    [['ranma 1/2'], 'Durante um treinamento na China, Ranma Saotome cai em uma fonte amaldiçoada e passa a se transformar em garota quando entra em contato com água fria. A maldição provoca confusões em sua vida e em seus desafios de artes marciais.'],
    [['sakamoto days'], 'Taro Sakamoto já foi considerado o maior assassino de todos, mas abandonou essa vida, casou-se e abriu uma loja. Quando antigos inimigos reaparecem, ele precisa proteger sua família e seu novo cotidiano.'],
    [['frieren', 'sousou no frieren', 'sousou no friere'], 'Depois da derrota do Rei Demônio, a maga élfica Frieren se despede dos antigos companheiros e parte em uma nova jornada. Ao conhecer novas pessoas, ela passa a compreender melhor o tempo, as lembranças e os laços que construiu.'],
    [['dr stone'], 'Após um fenômeno misterioso transformar a humanidade em pedra, o jovem cientista Senku Ishigami desperta milhares de anos depois. Ele decide reconstruir a civilização usando o conhecimento científico.'],
    [['kaguya sama', 'kaguya-sama'], 'Kaguya Shinomiya e Miyuki Shirogane gostam um do outro, mas nenhum aceita confessar primeiro. Na escola, os dois transformam cada conversa em uma disputa estratégica para fazer o outro declarar seus sentimentos.'],
    [['violet evergarden'], 'Depois da guerra, Violet Evergarden tenta encontrar um lugar no mundo e compreender as palavras “eu te amo”, ditas por alguém importante para ela. Como Auto Memory Doll, escreve cartas que ajudam outras pessoas a expressar seus sentimentos.'],
    [['your name', 'kimi no na wa'], 'Mitsuha, que vive em uma cidade rural, e Taki, um estudante de Tóquio, começam a trocar de corpo em sonhos. Quando as trocas cessam, Taki parte em busca da garota e de uma ligação que desafia o tempo.'],
    [['vinland saga'], 'Após testemunhar a morte do pai, Thorfinn cresce entre guerreiros vikings e busca vingança contra Askeladd. Em meio a guerras e disputas por poder, sua jornada o leva a questionar o sentido da violência.'],
    [['psycho pass'], 'Em um futuro no qual o Sistema Sibyl mede a propensão das pessoas ao crime, a inspetora Akane Tsunemori começa a questionar a justiça desse sistema enquanto trabalha na divisão de investigação criminal.'],
    [['overlord'], 'Quando um jogo online está prestes a encerrar, Momonga permanece conectado e descobre que foi transportado para um mundo onde seu personagem esquelético é real. Sem conseguir sair, ele explora esse novo mundo como Ainz Ooal Gown.'],
    [['berserk'], 'Guts, um guerreiro marcado por uma infância brutal, vaga por um mundo sombrio empunhando uma espada gigantesca. Sua busca por vingança está ligada à traição de Griffith e à maldição que persegue os sobreviventes do Bando do Falcão.'],
    [['clannad'], 'Tomoya Okazaki é um estudante que perdeu o interesse pela vida escolar. Ao conhecer Nagisa Furukawa e ajudá-la a reerguer o clube de teatro, ele se aproxima de outras colegas e passa a construir novos laços.'],
    [['horimiya'], 'Na escola, Kyouko Hori parece uma aluna popular e Izumi Miyamura, um colega discreto. Fora da sala, ambos revelam lados que escondem dos demais e começam uma amizade que transforma seus dias.'],
    [['toradora'], 'Ryuuji Takasu e Taiga Aisaka formam uma aliança para ajudar um ao outro a se aproximar de seus respectivos interesses amorosos. A convivência entre os dois acaba criando uma relação inesperada.'],
    [['k on', 'k-on'], 'Yui Hirasawa entra para o clube de música leve sem saber tocar instrumento. Com as outras integrantes, ela aprende guitarra e participa de ensaios, apresentações e momentos do cotidiano escolar.'],
];

function normalizeTitle(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

export function getPortugueseAnimeSynopsis(title: string): string | null {
    const normalizedTitle = normalizeTitle(title);
    const match = SYNOPSES_PT.find(([aliases]) => aliases.some((alias) => normalizedTitle.includes(normalizeTitle(alias))));
    return match?.[1] ?? null;
}
