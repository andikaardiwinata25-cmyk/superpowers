cd /home/user/superpowers/rehlata/proyek/01-zamzam
for i in 2 4 7 8; do
 t=$(python3 -c "
import json;w=json.load(open('words.json'));T=lambda i:w[i]['start']
R={2:(T(17),T(32)),0:(0,T(13)),1:(T(13),T(17)),3:(T(32),T(37)),4:(T(37),T(45)),5:(T(45),T(64)),6:(T(64),T(74)),7:(T(74),T(83)),8:(T(83),T(91)),9:(T(91),T(103)),10:(T(103),T(127)),12:(T(149),T(160)-.4),13:(T(160)-.4,79)}[$i]
print(R[0]+(R[1]-R[0])*0.55)")
 /opt/bvenv/bin/python blend3d.py $i still $t prev3d/s$i.jpg > prev3d/log$i.txt 2>&1; echo "$i done $(grep -c Traceback prev3d/log$i.txt)"
done
